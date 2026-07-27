package ma.ram.sigba.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class SecureTokenUtil {

    private static final String SECRET = "sigba-secret-key-for-token-signing-2024";
    private static final long EXPIRY_MS = 24 * 60 * 60 * 1000;
    private static final String ALGORITHM = "HmacSHA256";

    public static String generateToken(String email) {
        long expiry = System.currentTimeMillis() + EXPIRY_MS;
        String payload = email + ":" + expiry;
        String signature = sign(payload);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8))
                + "."
                + signature;
    }

    public static String validateToken(String token) {
        if (token == null || !token.contains(".")) {
            return null;
        }
        try {
            String[] parts = token.split("\\.", 2);
            String payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            String signature = parts[1];

            String expectedSignature = sign(payload);
            if (!expectedSignature.equals(signature)) {
                return null;
            }

            String[] payloadParts = payload.split(":");
            String email = payloadParts[0];
            long expiry = Long.parseLong(payloadParts[1]);

            if (System.currentTimeMillis() > expiry) {
                return null;
            }

            return email;
        } catch (Exception e) {
            return null;
        }
    }

    private static String sign(String payload) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            mac.init(keySpec);
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Erreur de signature du token", e);
        }
    }
}
