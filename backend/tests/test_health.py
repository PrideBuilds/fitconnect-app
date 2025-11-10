"""Test health check endpoint"""
import pytest
from django.test import Client


@pytest.mark.django_db
def test_health_endpoint():
    """Test that health check endpoint returns correct response"""
    client = Client()
    response = client.get('/api/health/')
    
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'healthy'
    assert data['message'] == 'FitConnect API is running'
    assert data['version'] == '1.0.0'
