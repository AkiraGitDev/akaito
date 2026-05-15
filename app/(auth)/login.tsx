import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

type Step = 'email' | 'code';

export default function Login() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep('code');
  }

  async function verifyCode() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    Alert.alert('Bem-vindo! 💖', 'Login feito com sucesso.');
  }

  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          contentContainerClassName="grow justify-center px-8 py-12"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text
            className="text-love-700 mb-2 text-5xl"
            style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
            akaito 💖
          </Text>
          <Text
            className="mb-10 text-base text-gray-600"
            style={{ fontFamily: 'Inter_400Regular' }}>
            {step === 'email'
              ? 'Entre com seu e-mail pra receber um código'
              : `Enviamos um código pra ${email}`}
          </Text>

          {step === 'email' ? (
            <>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!loading}
                style={{ fontFamily: 'Inter_400Regular' }}
                className="mb-4 rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
              />
              <Pressable
                onPress={sendCode}
                disabled={loading || !email.includes('@')}
                className="rounded-2xl bg-love-600 py-4 active:bg-love-700 disabled:opacity-50">
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    className="text-center text-base text-white"
                    style={{ fontFamily: 'Inter_600SemiBold' }}>
                    Enviar código
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
                placeholder="00000000"
                keyboardType="number-pad"
                maxLength={10}
                editable={!loading}
                style={{ fontFamily: 'DMSerifDisplay_400Regular' }}
                className="mb-4 rounded-2xl border border-love-200 bg-white px-5 py-4 text-center text-3xl tracking-widest"
              />
              <Pressable
                onPress={verifyCode}
                disabled={loading || code.length < 6}
                className="mb-3 rounded-2xl bg-love-600 py-4 active:bg-love-700 disabled:opacity-50">
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    className="text-center text-base text-white"
                    style={{ fontFamily: 'Inter_600SemiBold' }}>
                    Entrar
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  setStep('email');
                  setCode('');
                  setError(null);
                }}
                disabled={loading}>
                <Text
                  className="text-center text-sm text-gray-500"
                  style={{ fontFamily: 'Inter_400Regular' }}>
                  Trocar e-mail
                </Text>
              </Pressable>
            </>
          )}

          {error && (
            <Text
              className="mt-4 text-center text-sm text-red-600"
              style={{ fontFamily: 'Inter_400Regular' }}>
              {error}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
