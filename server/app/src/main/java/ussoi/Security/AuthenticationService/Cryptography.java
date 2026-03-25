package ussoi.Security.AuthenticationService;

import javax.crypto.Cipher;
import java.security.*;
import java.security.spec.MGF1ParameterSpec;
import java.util.Base64;

/**
 * *****************************************************************************
 *
 * @author nikhi
 * *****************************************************************************
 * @file cryptography.java
 * @attention Copyright (c) 2026
 * All rights reserved.
 * <p>
 * This software is licensed under the terms described in the LICENSE file
 * located in the root directory of this project.
 * If no LICENSE file is present, this software is provided "AS IS",
 * without warranty of any kind, express or implied.
 * <p>
 * *****************************************************************************
 */
public class Cryptography {

    private static final String ALGORITHM = "RSA";
    private static final String TRANSFORMATION = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding";

    private static final KeyPair keyPair;

    static {
        try {
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance(ALGORITHM);
            keyGen.initialize(2048);
            keyPair = keyGen.generateKeyPair();
        } catch (Exception e) {
            throw new RuntimeException("Key generation failed", e);
        }
    }

    public static String getPublicKeyString() {
        byte[] encoded = keyPair.getPublic().getEncoded();
        return Base64.getEncoder().encodeToString(encoded);
    }

    public static String rsaDecrypt(String base64Encrypted) throws Exception {

        byte[] encryptedBytes = Base64.getDecoder().decode(base64Encrypted);

        Cipher cipher = Cipher.getInstance(TRANSFORMATION);

        javax.crypto.spec.OAEPParameterSpec oaepParams =
                new javax.crypto.spec.OAEPParameterSpec(
                        "SHA-256",
                        "MGF1",
                        java.security.spec.MGF1ParameterSpec.SHA256,
                        javax.crypto.spec.PSource.PSpecified.DEFAULT
                );

        cipher.init(Cipher.DECRYPT_MODE, keyPair.getPrivate(), oaepParams);

        byte[] decryptedBytes = cipher.doFinal(encryptedBytes);

        return new String(decryptedBytes, java.nio.charset.StandardCharsets.UTF_8);
    }
}
