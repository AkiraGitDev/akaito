import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
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
  }

  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <View className="flex-1 justify-center px-8">
          <Text className="text-love-700 mb-2 text-4xl font-bold">akaito 💖</Text>
          <Text className="mb-10 text-base text-gray-600">
            {step === 'email'
              ? 'entre com seu e-mail pra receber um código'
              : `enviamos um código pra ${email}`}
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
                className="mb-4 rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
              />
              <Pressable
                onPress={sendCode}
                disabled={loading || !email.includes('@')}
                className="rounded-2xl bg-love-600 py-4 active:bg-love-700 disabled:opacity-50">
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-base font-semibold text-white">
                    enviar código
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                className="mb-4 rounded-2xl border border-love-200 bg-white px-5 py-4 text-center text-2xl tracking-widest"
              />
              <Pressable
                onPress={verifyCode}
                disabled={loading || code.length !== 6}
                className="mb-3 rounded-2xl bg-love-600 py-4 active:bg-love-700 disabled:opacity-50">
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-base font-semibold text-white">entrar</Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  setStep('email');
                  setCode('');
                  setError(null);
                }}
                disabled={loading}>
                <Text className="text-center text-sm text-gray-500">trocar e-mail</Text>
              </Pressable>
            </>
          )}

          {error && (
            <Text className="mt-4 text-center text-sm text-red-600">{error}</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
