from django.conf import settings
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

REFRESH_COOKIE = "refresh_token"

# Scoped to the auth endpoints, so the cookie is not attached to ordinary API calls.
COOKIE_PATH = "/api/auth/"


def set_refresh_cookie(response, refresh):
    """Store the refresh token where JavaScript cannot read it."""
    response.set_cookie(
        REFRESH_COOKIE,
        str(refresh),
        httponly=True,
        # Lax keeps the cookie off cross-site POSTs, which is what protects the
        # refresh endpoint from CSRF.
        samesite="Lax",
        secure=not settings.DEBUG,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        path=COOKIE_PATH,
    )


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=TokenObtainPairSerializer,
        responses={200: OpenApiResponse(description="Returns an access token and sets the refresh cookie.")},
    )
    def post(self, request):
        serializer = TokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tokens = serializer.validated_data
        response = Response({"access": str(tokens["access"])})
        set_refresh_cookie(response, tokens["refresh"])
        return response


class RefreshView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        request=None,
        responses={200: OpenApiResponse(description="Returns a new access token.")},
    )
    def post(self, request):
        raw_token = request.COOKIES.get(REFRESH_COOKIE)
        if not raw_token:
            return Response(
                {"detail": "No refresh token."}, status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(raw_token)
        except TokenError:
            return Response(
                {"detail": "Refresh token is invalid or expired."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response({"access": str(refresh.access_token)})


class LogoutView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=None, responses={204: OpenApiResponse(description="Cookie cleared.")})
    def post(self, request):
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie(REFRESH_COOKIE, path=COOKIE_PATH)
        return response
