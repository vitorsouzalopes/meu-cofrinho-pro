import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

export async function checkBiometric() {
  if (!Capacitor.isNativePlatform()) return { available: false };

  try {
    const result = await NativeBiometric.isAvailable();
    return { available: true, touchId: result.touchId, faceId: result.faceId, fingerprint: result.fingerprint };
  } catch (e) {
    return { available: false };
  }
}

export async function authenticateBiometric() {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    await NativeBiometric.verifyIdentity({
      reason: "Para acessar sua conta com segurança",
      title: "Autenticação Biométrica",
      subtitle: "Use sua digital ou rosto",
      description: "Confirme sua identidade para entrar",
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function setBiometricCredentials(username: string, password: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await NativeBiometric.setCredentials({
      username,
      password,
      server: "com.meucofrinho.app",
    });
  } catch (e) {
    console.error("Error setting biometric credentials", e);
  }
}

export async function getBiometricCredentials() {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    return await NativeBiometric.getCredentials({
      server: "com.meucofrinho.app",
    });
  } catch (e) {
    return null;
  }
}

export async function deleteBiometricCredentials() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await NativeBiometric.deleteCredentials({
      server: "com.meucofrinho.app",
    });
  } catch (e) {
    console.error("Error deleting biometric credentials", e);
  }
}
