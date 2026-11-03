# Auditoria do Projeto Android (Meu Cofrinho Pro)

Esta auditoria analisa a configuração de build, dependências, segurança, integridade e conformidade do projeto Android Capacitor (`com.meucofrinho.app`).

---

## 🚨 Problemas Críticos (Falha de Build)

### 1. Ausência do arquivo `cordova.variables.gradle`
- **Arquivo Afetado:** [app/capacitor.build.gradle](file:///C:/Users/vitor/Apps/meu-cofrinho-pro-main/meu-cofrinho-pro/android/app/capacitor.build.gradle#L10)
- **Problema:** O script tenta aplicar `../capacitor-cordova-android-plugins/cordova.variables.gradle`, que não existe no repositório. Isso causa falha imediata ao executar o build (`assembleDebug`).
- **Correção Recomendada:** Proteger o `apply from` com uma verificação de existência (`if (file(...).exists())`) ou criar o arquivo de variáveis do Cordova caso seja necessário.

---

## ⚠️ Alertas e Avisos de Configuração

### 2. Incompatibilidade de Versões Java (Java 11 vs Java 17)
- **Arquivos Afetados:** [app/build.gradle](file:///C:/Users/vitor/Apps/meu-cofrinho-pro-main/meu-cofrinho-pro/android/app/build.gradle#L41) e [app/capacitor.build.gradle](file:///C:/Users/vitor/Apps/meu-cofrinho-pro-main/meu-cofrinho-pro/android/app/capacitor.build.gradle#L3)
- **Problema:** O projeto raiz (`build.gradle`) configura `JavaVersion.VERSION_17` para todos os subprojetos, mas o módulo `app` e o `capacitor.build.gradle` forçam explicitamente `JavaVersion.VERSION_11`.
- **Recomendação:** Padronizar tudo para `JavaVersion.VERSION_17` (já que o Gradle 8.7+ e Kotlin 1.9.24 funcionam excelentemente com Java 17).

### 3. Uso de Jetifier Obsoletos
- **Arquivo Afetado:** [gradle.properties](file:///C:/Users/vitor/Apps/meu-cofrinho-pro-main/meu-cofrinho-pro/android/gradle.properties#L21)
- **Problema:** `android.enableJetifier=true` está ativado. O Jetifier é legado e desnecessário em projetos modernos que usam puramente AndroidX.
- **Recomendação:** Remover ou desativar o Jetifier (`android.enableJetifier=false`) para acelerar o tempo de build.

### 4. Ofuscação e Minificação Desativadas em Release
- **Arquivo Afetado:** [app/build.gradle](file:///C:/Users/vitor/Apps/meu-cofrinho-pro-main/meu-cofrinho-pro/android/app/build.gradle#L50)
- **Problema:** `minifyEnabled false` no build type `release`.
- **Recomendação:** Para aplicativos em produção (especialmente financeiros/gestão de dinheiro como "Meu Cofrinho"), habilitar `minifyEnabled true` e configurar corretamente as regras ProGuard/R8 para proteção contra engenharia reversa e redução do tamanho do APK.

### 5. Conflito Potencial de Versões do Google Play Services Ads
- **Arquivos Afetados:** [build.gradle (Root)](file:///C:/Users/vitor/Apps/meu-cofrinho-pro-main/meu-cofrinho-pro/android/build.gradle#L35) e [app/capacitor.build.gradle](file:///C:/Users/vitor/Apps/meu-cofrinho-pro-main/meu-cofrinho-pro/android/app/capacitor.build.gradle#L12)
- **Problema:** O root `build.gradle` força `play-services-ads:22.6.0`, enquanto `app/capacitor.build.gradle` importa `play-services-ads:25.4.0` (nota: versão 25.4.0 é uma versão futura/inexistente da API Ads, o que pode indicar um erro de digitação gerado pelo plugin de AdMob).
- **Recomendação:** Auditar a versão do plugin `capacitor-community-admob` e garantir consistência nas dependências de anúncios.

---

## ✅ Pontos Positivos e Boas Práticas Identificadas

1. **SDKs Modernos:** `compileSdk` e `targetSdk` configurados na versão 35 (Android 15), com `minSdk` 23 (suporte a partir do Android 6.0).
2. **Segurança de Backup:** `android:allowBackup="false"` no `AndroidManifest.xml`, impedindo que dados sensíveis do cofrinho sejam exportados via adb backup.
3. **Network Security Config:** Configuração explícita de segurança de rede (`network_security_config.xml`) desativando tráfego em texto plano (HTTP), exceto para `localhost` (essencial para WebView do Capacitor).
4. **Assinatura de Release:** Suporte a keystore externa via `keystore.properties` para builds de release automatizados.
5. **Permissões Adequadas:** Uso restrito a `INTERNET`, `USE_BIOMETRIC` e `POST_NOTIFICATIONS`.

---

## 🛠️ Plano de Ação Recomendado

1. **Corrigir o build.gradle do Capacitor** para verificar a existência de `cordova.variables.gradle` antes de aplicar.
2. **Sincronizar a versão do Java** para `JavaVersion.VERSION_17` no módulo `app`.
3. **Remover o Jetifier** (`android.enableJetifier=false`) em `gradle.properties`.
4. **Revisar a dependência do AdMob** para evitar conflitos de versão do Google Play Services Ads.
