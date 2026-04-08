package com.example.MotvirsWeb.Security;

public class SecurityConstants {

        public static final String[] PUBLIC_URLS = {
                        "/",
                        "/auth/**",
                        "/login",
                        "/registro/**",
                        "public/**"
        };

        public static final String[] STATIC_RESOURCES = {
                        "/css/**",
                        "/icon/**",
                        "/js/**",
                        "/img/**",
                        "/error/**",
                        "/favicon.ico"
        };

        public static final String[] PASAJERO_URLS = {
                        "/pasajero/**",
                        "/pasajero/panel**"
        };

        public static final String[] CONDUCTOR_URLS = {
                        "/conductor/**",
                        "/conductor/panel**"
        };

        public static final String[] ADMIN_URLS = {
                        "/admin/**",
                        "/api/admin/ml",
                        "/api/admin/**"
        };

        public static final String[] API_PASAJERO_URLS = {
                        "/api/pasajero/**"
        };

        public static final String[] API_CONDUCTOR_URLS = {
                        "/api/conductor/**"
        };

        public static final String[] SHARED_URLS = {
                        "/rating",
                        "/profile/**"
        };

        public static final String[] WEBSOCKET_URLS = {
                        "/ws/**",
                        "/topic/**"
        };

        public static final String[] API_URLS = {
                        "/api/**"
        };

        private SecurityConstants() {
                // Private constructor to prevent instantiation
        }
}
