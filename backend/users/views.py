from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, EmailVerificationToken, PasswordResetToken, ClientProfile, TrainerProfile
from .serializers import UserRegistrationSerializer, UserSerializer, ClientProfileSerializer, TrainerProfileSerializer
from .permissions import IsClient, IsTrainer
import secrets


class RegisterView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate email verification token
        token = secrets.token_urlsafe(32)
        EmailVerificationToken.objects.create(user=user, token=token)

        # TODO: Send verification email (implement in future task)
        # For now, just return success message with token for testing
        verification_url = f"http://localhost:5173/verify-email/{token}"

        return Response({
            'user': UserSerializer(user).data,
            'message': 'Registration successful. Please verify your email.',
            'verification_url': verification_url  # Remove in production, send via email
        }, status=status.HTTP_201_CREATED)


class EmailVerificationView(APIView):
    """Email verification endpoint"""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token_str = request.data.get('token')
        if not token_str:
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = EmailVerificationToken.objects.get(token=token_str)
        except EmailVerificationToken.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if token.is_expired():
            return Response(
                {'error': 'Token has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify user email
        user = token.user
        user.email_verified = True
        user.save()

        # Delete token after use
        token.delete()

        return Response({
            'message': 'Email verified successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').lower()
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check if email is verified
        if not user.email_verified:
            return Response(
                {'error': 'Please verify your email before logging in'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Get or update current user profile"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ForgotPasswordView(APIView):
    """Request password reset endpoint"""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').lower()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal that email doesn't exist (security)
            return Response({
                'message': 'If your email is registered, you will receive a password reset link.'
            }, status=status.HTTP_200_OK)

        # Generate password reset token
        token = secrets.token_urlsafe(32)
        PasswordResetToken.objects.create(user=user, token=token)

        # TODO: Send reset email (implement in future task)
        reset_url = f"http://localhost:5173/reset-password/{token}"

        return Response({
            'message': 'If your email is registered, you will receive a password reset link.',
            'reset_url': reset_url  # Remove in production, send via email
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """Reset password with token endpoint"""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token_str = request.data.get('token')
        new_password = request.data.get('password')

        if not token_str or not new_password:
            return Response(
                {'error': 'Token and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = PasswordResetToken.objects.get(token=token_str)
        except PasswordResetToken.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if token.is_expired():
            return Response(
                {'error': 'Token has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reset password
        user = token.user
        user.set_password(new_password)
        user.save()

        # Delete token after use
        token.delete()

        return Response({
            'message': 'Password reset successfully'
        }, status=status.HTTP_200_OK)


class ClientProfileView(generics.RetrieveUpdateAPIView):
    """Get or update current client's profile"""

    permission_classes = (permissions.IsAuthenticated, IsClient)
    serializer_class = ClientProfileSerializer

    def get_object(self):
        # Return the client profile for the current user
        profile, created = ClientProfile.objects.get_or_create(user=self.request.user)
        return profile


class TrainerProfileDetailView(generics.RetrieveAPIView):
    """Public view of trainer profile"""

    permission_classes = (permissions.AllowAny,)
    serializer_class = TrainerProfileSerializer
    queryset = TrainerProfile.objects.filter(verified=True)
    lookup_field = 'id'


class TrainerProfileUpdateView(generics.RetrieveUpdateAPIView):
    """Trainer can update their own profile"""

    permission_classes = (permissions.IsAuthenticated, IsTrainer)
    serializer_class = TrainerProfileSerializer

    def get_object(self):
        # Return the trainer profile for the current user
        profile, created = TrainerProfile.objects.get_or_create(user=self.request.user)
        return profile
