"""
Stream Chat Integration
Handles Stream Chat token generation and user setup
"""
from stream_chat import StreamChat
from django.conf import settings


def get_stream_client():
    """Get Stream Chat client instance"""
    return StreamChat(
        api_key=settings.STREAM_API_KEY,
        api_secret=settings.STREAM_API_SECRET
    )


def create_stream_token(user_id):
    """
    Generate Stream Chat token for a user

    Args:
        user_id: Django user ID (will be converted to string)

    Returns:
        str: Stream Chat token
    """
    client = get_stream_client()
    # Convert user ID to string as Stream requires string user IDs
    token = client.create_token(str(user_id))
    return token


def create_or_update_stream_user(user):
    """
    Create or update user in Stream Chat

    Args:
        user: Django User instance

    Returns:
        dict: Stream user data
    """
    client = get_stream_client()

    # Prepare user data
    user_data = {
        'id': str(user.id),
        'name': f"{user.first_name} {user.last_name}".strip() or user.username,
    }

    # Add email if available
    if user.email:
        user_data['email'] = user.email

    # Store role as custom field (not Stream's built-in role system)
    # This allows us to track user type without conflicting with Stream roles
    user_data['user_type'] = user.role

    # Upsert user (create or update)
    client.upsert_user(user_data)

    return user_data


def create_channel_between_users(client_user, trainer_user):
    """
    Create a direct messaging channel between client and trainer

    Args:
        client_user: Client User instance
        trainer_user: Trainer User instance

    Returns:
        dict: Channel data with channel_id
    """
    client = get_stream_client()

    # First, ensure both users exist in Stream Chat
    create_or_update_stream_user(client_user)
    create_or_update_stream_user(trainer_user)

    # Create channel ID (consistent naming: smaller ID first)
    user_ids = sorted([str(client_user.id), str(trainer_user.id)])
    channel_id = f"dm_{user_ids[0]}_{user_ids[1]}"

    # Create or get channel
    channel = client.channel(
        'messaging',  # Channel type
        channel_id,
        {
            'members': [str(client_user.id), str(trainer_user.id)],
        }
    )

    # Initialize the channel with the user who created it
    channel.create(str(client_user.id))

    return {
        'channel_id': channel_id,
        'channel_type': 'messaging'
    }
