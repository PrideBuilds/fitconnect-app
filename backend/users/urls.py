from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    # Registration and verification
    path('register/', views.RegisterView.as_view(), name='register'),
    path('verify-email/', views.EmailVerificationView.as_view(), name='verify_email'),

    # Login and token refresh
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Password reset
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset_password'),

    # Current user profile
    path('me/', views.CurrentUserView.as_view(), name='current_user'),

    # Profile endpoints
    path('profiles/client/', views.ClientProfileView.as_view(), name='client_profile'),
    path('profiles/trainer/me/', views.TrainerProfileUpdateView.as_view(), name='trainer_profile_update'),
    path('profiles/trainer/<int:id>/', views.TrainerProfileDetailView.as_view(), name='trainer_profile_detail'),

    # Stream Chat endpoints
    path('stream-token/', views.StreamChatTokenView.as_view(), name='stream_token'),
    path('create-chat-channel/', views.CreateChatChannelView.as_view(), name='create_chat_channel'),
]
