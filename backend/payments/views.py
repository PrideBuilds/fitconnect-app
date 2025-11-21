from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
import stripe
import logging

from .models import Payment
from .serializers import (
    PaymentSerializer,
    CreatePaymentIntentSerializer,
    RefundPaymentSerializer
)
from bookings.models import Booking
from .emails import (
    send_payment_confirmation_email,
    send_payment_failure_email,
    send_refund_confirmation_email
)

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class CreatePaymentIntentView(APIView):
    """Create a Stripe PaymentIntent for a booking"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create a PaymentIntent for the specified booking"""
        serializer = CreatePaymentIntentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking_id = serializer.validated_data['booking_id']

        try:
            with transaction.atomic():
                booking = Booking.objects.select_for_update().get(id=booking_id)

                # Verify user is the client making the booking
                if booking.client != request.user:
                    return Response(
                        {"error": "You can only pay for your own bookings"},
                        status=status.HTTP_403_FORBIDDEN
                    )

                # Check if payment already exists
                if hasattr(booking, 'payment'):
                    payment = booking.payment
                    # Retrieve the payment intent from Stripe to check its actual status
                    intent = stripe.PaymentIntent.retrieve(payment.stripe_payment_intent_id)

                    # Only reuse if PaymentIntent is in a non-terminal state
                    # Terminal states: succeeded, canceled, requires_payment_method (failed)
                    # Reusable states: requires_payment_method, requires_confirmation, requires_action, processing
                    if intent.status in ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing']:
                        return Response({
                            "client_secret": intent.client_secret,
                            "payment_intent_id": intent.id,
                            "payment_id": payment.id,
                            "amount": str(payment.amount),
                            "status": payment.status
                        })

                    # If PaymentIntent is in terminal state (succeeded, canceled),
                    # delete the old payment record so we can create a new one
                    logger.info(f"PaymentIntent {intent.id} is in terminal state '{intent.status}', creating new one")
                    payment.delete()

                # Create Stripe PaymentIntent
                amount_cents = int(booking.total_price * 100)  # Convert to cents

                intent = stripe.PaymentIntent.create(
                    amount=amount_cents,
                    currency='usd',
                    metadata={
                        'booking_id': booking.id,
                        'client_id': booking.client.id,
                        'trainer_id': booking.trainer.id,
                        'client_email': booking.client.email,
                    },
                    description=f"Training session with {booking.trainer.user.get_full_name() or booking.trainer.user.email}"
                )

                # Create Payment record
                payment = Payment.objects.create(
                    booking=booking,
                    client=booking.client,
                    trainer=booking.trainer,
                    stripe_payment_intent_id=intent.id,
                    amount=booking.total_price,
                    currency='usd',
                    status='pending'
                )

                # Update booking payment status
                booking.payment_status = 'pending'
                booking.save()

                logger.info(f"Payment intent created: {intent.id} for booking {booking.id}")

                return Response({
                    "client_secret": intent.client_secret,
                    "payment_intent_id": intent.id,
                    "payment_id": payment.id,
                    "amount": str(payment.amount),
                    "currency": payment.currency
                }, status=status.HTTP_201_CREATED)

        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {str(e)}")
            return Response(
                {"error": f"Payment processing error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating payment intent: {str(e)}")
            return Response(
                {"error": "An error occurred processing your payment"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentDetailView(generics.RetrieveAPIView):
    """Get details of a specific payment"""

    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter payments to only those belonging to the user"""
        user = self.request.user

        if user.role == 'client':
            return Payment.objects.filter(client=user)
        elif user.role == 'trainer':
            return Payment.objects.filter(trainer__user=user)
        elif user.role == 'admin':
            return Payment.objects.all()

        return Payment.objects.none()


class PaymentListView(generics.ListAPIView):
    """List all payments for the authenticated user"""

    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter payments based on user role"""
        user = self.request.user

        if user.role == 'client':
            return Payment.objects.filter(client=user).order_by('-created_at')
        elif user.role == 'trainer':
            return Payment.objects.filter(trainer__user=user).order_by('-created_at')
        elif user.role == 'admin':
            return Payment.objects.all().order_by('-created_at')

        return Payment.objects.none()


class ConfirmPaymentView(APIView):
    """Confirm payment status by checking with Stripe (for local testing without webhooks)"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Manually confirm payment by fetching from Stripe"""
        payment_intent_id = request.data.get('payment_intent_id')

        if not payment_intent_id:
            return Response(
                {"error": "payment_intent_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Fetch the payment from our database
            payment = Payment.objects.get(stripe_payment_intent_id=payment_intent_id)

            # Verify user owns this payment
            if payment.client != request.user:
                return Response(
                    {"error": "You can only confirm your own payments"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Fetch the payment intent from Stripe to get latest status
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            # If payment succeeded, update our records
            if intent.status == 'succeeded':
                # Call the same handler that the webhook uses
                handle_payment_succeeded(intent)

                return Response({
                    "message": "Payment confirmed successfully",
                    "payment": PaymentSerializer(payment).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "message": f"Payment status is {intent.status}",
                    "status": intent.status
                }, status=status.HTTP_200_OK)

        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.StripeError as e:
            logger.error(f"Stripe error confirming payment: {str(e)}")
            return Response(
                {"error": f"Error confirming payment: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error confirming payment: {str(e)}")
            return Response(
                {"error": "An error occurred confirming the payment"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RefundPaymentView(APIView):
    """Process a refund for a payment"""

    permission_classes = [IsAuthenticated]

    def post(self, request, payment_id):
        """Process a refund"""
        serializer = RefundPaymentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payment = Payment.objects.select_for_update().get(id=payment_id)

            # Check permissions (only admin or the trainer/client involved can refund)
            if request.user.role != 'admin':
                if request.user != payment.client and request.user != payment.trainer.user:
                    return Response(
                        {"error": "You don't have permission to refund this payment"},
                        status=status.HTTP_403_FORBIDDEN
                    )

            # Check if payment can be refunded
            if not payment.is_refundable():
                return Response(
                    {"error": "Payment cannot be refunded"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            refund_amount = serializer.validated_data['amount']
            reason = serializer.validated_data.get('reason', '')

            # Check refund amount is valid
            if refund_amount > payment.get_refundable_amount():
                return Response(
                    {"error": f"Refund amount exceeds refundable amount of ${payment.get_refundable_amount()}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Process refund with Stripe
            refund_amount_cents = int(refund_amount * 100)

            refund = stripe.Refund.create(
                payment_intent=payment.stripe_payment_intent_id,
                amount=refund_amount_cents,
                reason='requested_by_customer',
                metadata={
                    'payment_id': payment.id,
                    'booking_id': payment.booking.id,
                    'reason': reason
                }
            )

            # Update payment record
            payment.process_refund(refund_amount, reason)

            # Update booking payment status
            if payment.status == 'refunded':
                payment.booking.payment_status = 'refunded'
            else:
                payment.booking.payment_status = 'paid'  # Still partially paid
            payment.booking.save()

            logger.info(f"Refund processed: ${refund_amount} for payment {payment.id}")

            # Send refund confirmation email
            send_refund_confirmation_email(payment, refund_amount, reason)

            return Response({
                "message": "Refund processed successfully",
                "refund_id": refund.id,
                "amount": str(refund_amount),
                "payment": PaymentSerializer(payment).data
            }, status=status.HTTP_200_OK)

        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error processing refund: {str(e)}")
            return Response(
                {"error": f"Refund processing error: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error processing refund: {str(e)}")
            return Response(
                {"error": "An error occurred processing the refund"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@csrf_exempt
def stripe_webhook(request):
    """Handle Stripe webhook events"""

    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {str(e)}")
        return HttpResponse(status=400)
    except Exception as e:
        # Catch signature verification errors and any other webhook errors
        logger.error(f"Invalid webhook signature: {str(e)}")
        return HttpResponse(status=400)

    # Handle the event
    event_type = event['type']
    event_data = event['data']['object']

    logger.info(f"Received Stripe webhook: {event_type}")

    if event_type == 'payment_intent.succeeded':
        handle_payment_succeeded(event_data)
    elif event_type == 'payment_intent.payment_failed':
        handle_payment_failed(event_data)
    elif event_type == 'payment_intent.canceled':
        handle_payment_canceled(event_data)
    elif event_type == 'charge.refunded':
        handle_charge_refunded(event_data)

    return HttpResponse(status=200)


def handle_payment_succeeded(payment_intent):
    """Handle successful payment"""
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=payment_intent['id'])

        # Get charge details
        charges = payment_intent.get('charges', {}).get('data', [])
        charge = charges[0] if charges else {}

        # Update payment
        payment.mark_succeeded(
            charge_id=charge.get('id', ''),
            receipt_url=charge.get('receipt_url', ''),
            payment_method_details=charge.get('payment_method_details')
        )

        # Update booking
        payment.booking.mark_paid()

        logger.info(f"Payment succeeded: {payment.id}")

        # Send payment confirmation email
        send_payment_confirmation_email(payment)

    except Payment.DoesNotExist:
        logger.error(f"Payment not found for intent: {payment_intent['id']}")
    except Exception as e:
        logger.error(f"Error handling payment success: {str(e)}")


def handle_payment_failed(payment_intent):
    """Handle failed payment"""
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=payment_intent['id'])

        error = payment_intent.get('last_payment_error', {})
        failure_code = error.get('code', '')
        failure_message = error.get('message', '')

        payment.mark_failed(failure_code, failure_message)

        # Update booking
        payment.booking.mark_payment_failed()

        logger.info(f"Payment failed: {payment.id} - {failure_message}")

        # Send payment failure email
        send_payment_failure_email(payment, failure_message)

    except Payment.DoesNotExist:
        logger.error(f"Payment not found for intent: {payment_intent['id']}")
    except Exception as e:
        logger.error(f"Error handling payment failure: {str(e)}")


def handle_payment_canceled(payment_intent):
    """Handle canceled payment"""
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=payment_intent['id'])
        payment.status = 'canceled'
        payment.save()

        logger.info(f"Payment canceled: {payment.id}")

    except Payment.DoesNotExist:
        logger.error(f"Payment not found for intent: {payment_intent['id']}")
    except Exception as e:
        logger.error(f"Error handling payment cancellation: {str(e)}")


def handle_charge_refunded(charge):
    """Handle refunded charge"""
    try:
        # Note: We handle refunds in the RefundPaymentView
        # This webhook is just for confirmation/logging
        payment_intent_id = charge.get('payment_intent')
        if payment_intent_id:
            payment = Payment.objects.get(stripe_payment_intent_id=payment_intent_id)
            logger.info(f"Charge refunded webhook received for payment: {payment.id}")

    except Payment.DoesNotExist:
        logger.error(f"Payment not found for charge refund")
    except Exception as e:
        logger.error(f"Error handling charge refund: {str(e)}")
