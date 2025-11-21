from django.urls import path
from .views import (
    CreatePaymentIntentView,
    PaymentDetailView,
    PaymentListView,
    ConfirmPaymentView,
    RefundPaymentView,
    stripe_webhook
)

app_name = 'payments'

urlpatterns = [
    # Payment management
    path('', PaymentListView.as_view(), name='payment-list'),
    path('<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),

    # Stripe integration
    path('create-payment-intent/', CreatePaymentIntentView.as_view(), name='create-payment-intent'),
    path('confirm/', ConfirmPaymentView.as_view(), name='confirm-payment'),
    path('<int:payment_id>/refund/', RefundPaymentView.as_view(), name='refund-payment'),

    # Stripe webhook
    path('webhook/', stripe_webhook, name='stripe-webhook'),
]
