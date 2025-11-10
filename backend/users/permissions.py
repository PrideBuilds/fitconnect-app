from rest_framework import permissions


class IsClient(permissions.BasePermission):
    """
    Permission to only allow clients to access a view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'client'


class IsTrainer(permissions.BasePermission):
    """
    Permission to only allow trainers to access a view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'trainer'


class IsAdmin(permissions.BasePermission):
    """
    Permission to only allow admins to access a view.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners to edit their profile.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner
        # obj.user is the User instance from profile
        return obj.user == request.user


class IsClientOrTrainer(permissions.BasePermission):
    """
    Permission to allow both clients and trainers.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in ['client', 'trainer']
        )
