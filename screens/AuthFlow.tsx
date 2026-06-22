import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
} from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Ionicons, Feather } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

type Step =
  | 'WELCOME'
  | 'LOGIN'
  | 'SIGNUP_CREDENTIALS' // Step 1
  | 'SIGNUP_PROFILE'     // Step 2
  | 'SIGNUP_INTERESTS'   // Step 3
  | 'SIGNUP_SUPERPOWER'  // Step 4
  | 'SIGNUP_ROLE'        // Step 5
  | 'VERIFICATION'       // OTP Verification
  | 'SUCCESS';

interface AuthFlowProps {
  isDarkMode: boolean;
  onAuthComplete: (userData: any) => void;
}

export function AuthFlow({ isDarkMode, onAuthComplete }: AuthFlowProps) {
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Flow State
  const [currentStep, setCurrentStep] = useState<Step>('WELCOME');
  const [previousSteps, setPreviousSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form Data (Temporarily Saved)
  const [formData, setFormData] = useState({
    identifier: '', // email / username / phone for login
    loginPassword: '',
    emailOrPhone: '', // signup step 1
    password: '',     // signup step 1
    fullName: '',     // signup step 2
    username: '',     // signup step 2
    agreeToTerms: false,
    agreeToPrivacy: false,
    interests: [] as string[], // signup step 3
    timeCommitment: '',        // signup step 4: "< 2 hrs/week", "2-5 hrs/week", "5+ hrs/week"
    style: '',                 // signup step 4: "Remote", "In-person", "Hybrid"
    experience: '',            // signup step 4: "Yes", "No"
    role: '',                  // signup step 5: "College Student", "Working Professional", "Freelancer", "Giving Back"
  });

  // Focus and Validation states
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // OTP inputs
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(59);
  const otpInputsRef = useRef<any[]>([]);

  // Navigation helpers to track stack for back button
  const navigateTo = (nextStep: Step) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setErrorMsg(null);
    setPreviousSteps((prev) => [...prev, currentStep]);
    setCurrentStep(nextStep);
  };

  const navigateBack = () => {
    if (previousSteps.length > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setErrorMsg(null);
      const prev = previousSteps[previousSteps.length - 1];
      setPreviousSteps((steps) => steps.slice(0, -1));
      setCurrentStep(prev);
    }
  };

  // Timer for OTP code
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === 'VERIFICATION' && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, otpTimer]);

  // Validation Checkers
  const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isPhone = (val: string) => /^\+?[0-9]{10,14}$/.test(val);
  
  // Signup Step 1 validation
  const validateSignupCredentials = () => {
    const validEmailOrPhone = isEmail(formData.emailOrPhone) || isPhone(formData.emailOrPhone);
    const pass = formData.password;
    const hasMinLength = pass.length >= 8;
    const hasUppercase = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return validEmailOrPhone && hasMinLength && hasUppercase && hasNumber;
  };

  // Signup Step 2 validation
  const validateProfile = () => {
    return (
      formData.fullName.trim().length >= 2 &&
      formData.username.trim().length >= 3 &&
      formData.agreeToTerms &&
      formData.agreeToPrivacy
    );
  };

  // Action Handlers
  const handleLogin = () => {
    setLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      setLoading(false);
      // Simulate validation / authentication checks
      if (
        formData.identifier.trim().length > 0 &&
        formData.loginPassword === 'Admin123!'
      ) {
        onAuthComplete({
          emailOrPhone: formData.identifier,
          fullName: 'John Admin',
          username: 'admin',
          interests: ['Tech', 'Education'],
          role: 'Working Professional',
        });
      } else {
        // Secure generic error message to prevent field detection
        setErrorMsg('Incorrect email or password');
      }
    }, 1500);
  };

  const handleSignupStart = () => {
    navigateTo('SIGNUP_CREDENTIALS');
  };

  const handleCredentialsSubmit = () => {
    if (validateSignupCredentials()) {
      navigateTo('SIGNUP_PROFILE');
    }
  };

  const handleProfileSubmit = () => {
    if (validateProfile()) {
      // Direct user to Verification Screen before proceeding to personalization
      setOtpTimer(59);
      navigateTo('VERIFICATION');
    }
  };

  const handleOtpVerify = () => {
    const code = otpCode.join('');
    if (code.length < 6) return;

    setLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      setLoading(false);
      if (code === '123456') {
        // OTP Success -> Proceed to personalization onboarding steps
        navigateTo('SIGNUP_INTERESTS');
      } else {
        setErrorMsg('Invalid verification code. Please try again.');
      }
    }, 1500);
  };

  const handleResendOtp = () => {
    setOtpTimer(59);
    setOtpCode(['', '', '', '', '', '']);
    setErrorMsg(null);
    otpInputsRef.current[0]?.focus();
  };

  const handleInterestsSubmit = () => {
    if (formData.interests.length > 0) {
      navigateTo('SIGNUP_SUPERPOWER');
    }
  };

  const handleSuperpowerSubmit = () => {
    if (formData.timeCommitment && formData.style && formData.experience) {
      navigateTo('SIGNUP_ROLE');
    }
  };

  const handleRoleSubmit = (selectedRole: string) => {
    const updatedData = { ...formData, role: selectedRole };
    setFormData(updatedData);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigateTo('SUCCESS');
    }, 1500);
  };

  const finishOnboarding = () => {
    onAuthComplete({
      emailOrPhone: formData.emailOrPhone,
      fullName: formData.fullName,
      username: formData.username,
      interests: formData.interests,
      timeCommitment: formData.timeCommitment,
      style: formData.style,
      experience: formData.experience,
      role: formData.role,
    });
  };

  // Helper styles based on focus / errors
  const getFieldBorderColor = (fieldName: string, isValid: boolean, isError = false) => {
    if (isError) return colors.dangerForeground1;
    if (focusedField === fieldName) return colors.brandForeground1;
    if (isValid) return colors.successForeground1;
    return colors.neutralStroke1;
  };

  // UI Components per flow state
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.neutralBackground1 }]}
    >
      {/* Header bar with Back button */}
      {currentStep !== 'WELCOME' && currentStep !== 'SUCCESS' && (
        <View style={styles.header}>
          <Pressable onPress={navigateBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.neutralForeground1} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.neutralForeground1 }]}>
            {currentStep.startsWith('SIGNUP_') ? 'Create Account' : 'Sign In'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ================= WELCOME SCREEN ================= */}
        {currentStep === 'WELCOME' && (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeTextSection}>
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.brandBackgroundSubtle }]}>
                <Ionicons name="people" size={48} color={colors.brandForeground1} />
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.neutralForeground1 }]}>
                Social Workers
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.neutralForeground3 }]}>
                Empowering Communities, Together. Connecting passionate volunteers with meaningful local causes.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.brandBackground }]}
                onPress={handleSignupStart}
              >
                <Text style={[styles.primaryButtonText, { color: colors.neutralForegroundOnBrand }]}>
                  Sign Up
                </Text>
              </Pressable>

              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.brandForeground1 }]}
                onPress={() => navigateTo('LOGIN')}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.brandForeground1 }]}>
                  Log In
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ================= LOGIN SCREEN ================= */}
        {currentStep === 'LOGIN' && (
          <View style={styles.formContainer}>
            <Text style={[styles.titleText, { color: colors.neutralForeground1 }]}>Welcome back</Text>
            <Text style={[styles.subtitleText, { color: colors.neutralForeground3 }]}>
              Sign in to continue your volunteer journey.
            </Text>

            {errorMsg && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerBackgroundSubtle }]}>
                <Ionicons name="alert-circle" size={20} color={colors.dangerForeground1} />
                <Text style={[styles.errorBoxText, { color: colors.dangerForeground1 }]}>
                  {errorMsg}
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.neutralForeground2 }]}>
                Email, Username, or Phone
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: getFieldBorderColor(
                      'identifier',
                      formData.identifier.trim().length > 0,
                      !!errorMsg
                    ),
                  },
                ]}
              >
                <Ionicons name="person-outline" size={20} color={colors.neutralForeground3} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.neutralForeground1 }]}
                  placeholder="name@example.com or @username"
                  placeholderTextColor={colors.neutralForegroundDisabled}
                  value={formData.identifier}
                  onChangeText={(text) => {
                    setErrorMsg(null);
                    setFormData({ ...formData, identifier: text });
                  }}
                  onFocus={() => setFocusedField('identifier')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.neutralForeground2 }]}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: getFieldBorderColor(
                      'loginPassword',
                      formData.loginPassword.length >= 8,
                      !!errorMsg
                    ),
                  },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.neutralForeground3} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.neutralForeground1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.neutralForegroundDisabled}
                  secureTextEntry={!showLoginPassword}
                  value={formData.loginPassword}
                  onChangeText={(text) => {
                    setErrorMsg(null);
                    setFormData({ ...formData, loginPassword: text });
                  }}
                  onFocus={() => setFocusedField('loginPassword')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowLoginPassword(!showLoginPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showLoginPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.neutralForeground3}
                  />
                </Pressable>
              </View>
              <Pressable style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: colors.brandForeground1 }]}>
                  Forgot Password?
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    formData.identifier.trim() && formData.loginPassword
                      ? colors.brandBackground
                      : colors.neutralBackgroundDisabled,
                  marginTop: Spacing.l,
                },
              ]}
              disabled={!formData.identifier.trim() || !formData.loginPassword || loading}
              onPress={handleLogin}
            >
              {loading ? (
                <ActivityIndicator color={colors.neutralForegroundOnBrand} />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    {
                      color:
                        formData.identifier.trim() && formData.loginPassword
                          ? colors.neutralForegroundOnBrand
                          : colors.neutralForegroundDisabled,
                    },
                  ]}
                >
                  Log In
                </Text>
              )}
            </Pressable>

            {/* Quick Demo Help Text */}
            <View style={[styles.helpBox, { backgroundColor: colors.infoBackgroundSubtle }]}>
              <Text style={[styles.helpBoxTitle, { color: colors.neutralForeground2 }]}>Demo Credentials:</Text>
              <Text style={[styles.helpBoxText, { color: colors.neutralForeground3 }]}>
                Password: <Text style={{ fontWeight: 'bold' }}>Admin123!</Text> (Identifier can be anything)
              </Text>
            </View>
          </View>
        )}

        {/* ================= SIGNUP STEP 1: CREDENTIALS ================= */}
        {currentStep === 'SIGNUP_CREDENTIALS' && (
          <View style={styles.formContainer}>
            <Text style={[styles.stepIndicator, { color: colors.brandForeground1 }]}>Step 1 of 5</Text>
            <Text style={[styles.titleText, { color: colors.neutralForeground1 }]}>Create credentials</Text>
            <Text style={[styles.subtitleText, { color: colors.neutralForeground3 }]}>
              Begin your account setup. Use an email or mobile phone number.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.neutralForeground2 }]}>Email or Mobile Number</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: getFieldBorderColor(
                      'emailOrPhone',
                      isEmail(formData.emailOrPhone) || isPhone(formData.emailOrPhone)
                    ),
                  },
                ]}
              >
                <Ionicons name="mail-outline" size={20} color={colors.neutralForeground3} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.neutralForeground1 }]}
                  placeholder="email@example.com or +1234567890"
                  placeholderTextColor={colors.neutralForegroundDisabled}
                  value={formData.emailOrPhone}
                  onChangeText={(text) => setFormData({ ...formData, emailOrPhone: text })}
                  onFocus={() => setFocusedField('emailOrPhone')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.neutralForeground2 }]}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: getFieldBorderColor(
                      'password',
                      formData.password.length >= 8 &&
                        /[A-Z]/.test(formData.password) &&
                        /[0-9]/.test(formData.password)
                    ),
                  },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.neutralForeground3} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.neutralForeground1 }]}
                  placeholder="Create password"
                  placeholderTextColor={colors.neutralForegroundDisabled}
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.neutralForeground3}
                  />
                </Pressable>
              </View>

              {/* Password Checklist */}
              <View style={styles.checklistContainer}>
                <View style={styles.checkItem}>
                  <Ionicons
                    name={formData.password.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={formData.password.length >= 8 ? colors.successForeground1 : colors.neutralForeground3}
                  />
                  <Text
                    style={[
                      styles.checkText,
                      { color: formData.password.length >= 8 ? colors.successForeground1 : colors.neutralForeground3 },
                    ]}
                  >
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons
                    name={/[A-Z]/.test(formData.password) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={/[A-Z]/.test(formData.password) ? colors.successForeground1 : colors.neutralForeground3}
                  />
                  <Text
                    style={[
                      styles.checkText,
                      { color: /[A-Z]/.test(formData.password) ? colors.successForeground1 : colors.neutralForeground3 },
                    ]}
                  >
                    Contains an uppercase letter
                  </Text>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons
                    name={/[0-9]/.test(formData.password) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={/[0-9]/.test(formData.password) ? colors.successForeground1 : colors.neutralForeground3}
                  />
                  <Text
                    style={[
                      styles.checkText,
                      { color: /[0-9]/.test(formData.password) ? colors.successForeground1 : colors.neutralForeground3 },
                    ]}
                  >
                    Contains a number
                  </Text>
                </View>
              </View>
            </View>

            {/* Social Authentication Integrations */}
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.neutralStroke2 }]} />
              <Text style={[styles.dividerText, { color: colors.neutralForeground3 }]}>or continue with</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.neutralStroke2 }]} />
            </View>

            <View style={styles.oauthRow}>
              <Pressable
                style={[styles.oauthButton, { borderColor: colors.neutralStroke1, backgroundColor: colors.neutralBackground2 }]}
                onPress={() => {
                  setFormData({
                    ...formData,
                    emailOrPhone: 'google.volunteer@gmail.com',
                    password: 'OAuthVerified1!',
                  });
                }}
              >
                <Ionicons name="logo-google" size={18} color={colors.neutralForeground1} />
                <Text style={[styles.oauthText, { color: colors.neutralForeground1 }]}>Google</Text>
              </Pressable>

              <Pressable
                style={[styles.oauthButton, { borderColor: colors.neutralStroke1, backgroundColor: colors.neutralBackground2 }]}
                onPress={() => {
                  setFormData({
                    ...formData,
                    emailOrPhone: 'apple.volunteer@icloud.com',
                    password: 'OAuthVerified1!',
                  });
                }}
              >
                <Ionicons name="logo-apple" size={18} color={colors.neutralForeground1} />
                <Text style={[styles.oauthText, { color: colors.neutralForeground1 }]}>Apple</Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor: validateSignupCredentials()
                    ? colors.brandBackground
                    : colors.neutralBackgroundDisabled,
                  marginTop: Spacing.xl,
                },
              ]}
              disabled={!validateSignupCredentials()}
              onPress={handleCredentialsSubmit}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color: validateSignupCredentials()
                      ? colors.neutralForegroundOnBrand
                      : colors.neutralForegroundDisabled,
                  },
                ]}
              >
                Continue
              </Text>
            </Pressable>
          </View>
        )}

        {/* ================= SIGNUP STEP 2: PROFILE & LEGAL ================= */}
        {currentStep === 'SIGNUP_PROFILE' && (
          <View style={styles.formContainer}>
            <Text style={[styles.stepIndicator, { color: colors.brandForeground1 }]}>Step 2 of 5</Text>
            <Text style={[styles.titleText, { color: colors.neutralForeground1 }]}>Create profile</Text>
            <Text style={[styles.subtitleText, { color: colors.neutralForeground3 }]}>
              Tell us a bit about yourself.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.neutralForeground2 }]}>Full Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: getFieldBorderColor('fullName', formData.fullName.trim().length >= 2) },
                ]}
              >
                <Feather name="user" size={18} color={colors.neutralForeground3} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.neutralForeground1 }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.neutralForegroundDisabled}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.neutralForeground2 }]}>Username</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: getFieldBorderColor('username', formData.username.trim().length >= 3) },
                ]}
              >
                <Text style={[styles.atSymbol, { color: colors.neutralForeground3 }]}>@</Text>
                <TextInput
                  style={[styles.input, { color: colors.neutralForeground1 }]}
                  placeholder="username"
                  placeholderTextColor={colors.neutralForegroundDisabled}
                  value={formData.username}
                  onChangeText={(text) => setFormData({ ...formData, username: text.replace(/\s+/g, '') })}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Consent Layer */}
            <View style={styles.consentSection}>
              <Pressable
                style={styles.checkboxRow}
                onPress={() => setFormData({ ...formData, agreeToTerms: !formData.agreeToTerms })}
              >
                <Ionicons
                  name={formData.agreeToTerms ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={formData.agreeToTerms ? colors.brandForeground1 : colors.neutralStrokeAccessible}
                />
                <Text style={[styles.checkboxLabel, { color: colors.neutralForeground2 }]}>
                  I agree to the <Text style={{ color: colors.brandForeground1, fontWeight: 'bold' }}>Terms of Service</Text>
                </Text>
              </Pressable>

              <Pressable
                style={styles.checkboxRow}
                onPress={() => setFormData({ ...formData, agreeToPrivacy: !formData.agreeToPrivacy })}
              >
                <Ionicons
                  name={formData.agreeToPrivacy ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={formData.agreeToPrivacy ? colors.brandForeground1 : colors.neutralStrokeAccessible}
                />
                <Text style={[styles.checkboxLabel, { color: colors.neutralForeground2 }]}>
                  I agree to the <Text style={{ color: colors.brandForeground1, fontWeight: 'bold' }}>Privacy Policy</Text>
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor: validateProfile() ? colors.brandBackground : colors.neutralBackgroundDisabled,
                  marginTop: Spacing.xl,
                },
              ]}
              disabled={!validateProfile()}
              onPress={handleProfileSubmit}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color: validateProfile() ? colors.neutralForegroundOnBrand : colors.neutralForegroundDisabled,
                  },
                ]}
              >
                Continue
              </Text>
            </Pressable>
          </View>
        )}

        {/* ================= OTP VERIFICATION ================= */}
        {currentStep === 'VERIFICATION' && (
          <View style={styles.formContainer}>
            <Text style={[styles.titleText, { color: colors.neutralForeground1 }]}>Enter verification code</Text>
            <Text style={[styles.subtitleText, { color: colors.neutralForeground3 }]}>
              We sent a 6-digit code to {formData.emailOrPhone}. Enter it below to verify.
            </Text>

            {errorMsg && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerBackgroundSubtle }]}>
                <Ionicons name="alert-circle" size={20} color={colors.dangerForeground1} />
                <Text style={[styles.errorBoxText, { color: colors.dangerForeground1 }]}>
                  {errorMsg}
                </Text>
              </View>
            )}

            <View style={styles.otpInputRow}>
              {otpCode.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => { otpInputsRef.current[idx] = ref; }}
                  style={[
                    styles.otpBox,
                    {
                      borderColor: digit ? colors.brandForeground1 : colors.neutralStroke1,
                      color: colors.neutralForeground1,
                      backgroundColor: colors.neutralBackground2,
                    },
                  ]}
                  value={digit}
                  onChangeText={(val) => {
                    setErrorMsg(null);
                    const cleanVal = val.replace(/[^0-9]/g, '');
                    const newOtp = [...otpCode];
                    newOtp[idx] = cleanVal.slice(-1);
                    setOtpCode(newOtp);

                    if (cleanVal && idx < 5) {
                      otpInputsRef.current[idx + 1]?.focus();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && !otpCode[idx] && idx > 0) {
                      const newOtp = [...otpCode];
                      newOtp[idx - 1] = '';
                      setOtpCode(newOtp);
                      otpInputsRef.current[idx - 1]?.focus();
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <View style={styles.timerRow}>
              {otpTimer > 0 ? (
                <Text style={[styles.timerText, { color: colors.neutralForeground3 }]}>
                  Resend code in <Text style={{ fontWeight: '600' }}>0:{otpTimer.toString().padStart(2, '0')}</Text>
                </Text>
              ) : (
                <Pressable onPress={handleResendOtp}>
                  <Text style={[styles.resendLink, { color: colors.brandForeground1 }]}>
                    Resend verification code
                  </Text>
                </Pressable>
              )}
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor: otpCode.join('').length === 6 ? colors.brandBackground : colors.neutralBackgroundDisabled,
                  marginTop: Spacing.xl,
                },
              ]}
              disabled={otpCode.join('').length < 6 || loading}
              onPress={handleOtpVerify}
            >
              {loading ? (
                <ActivityIndicator color={colors.neutralForegroundOnBrand} />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    {
                      color: otpCode.join('').length === 6 ? colors.neutralForegroundOnBrand : colors.neutralForegroundDisabled,
                    },
                  ]}
                >
                  Verify Code
                </Text>
              )}
            </Pressable>

            {/* Quick Demo Help Text */}
            <View style={[styles.helpBox, { backgroundColor: colors.infoBackgroundSubtle }]}>
              <Text style={[styles.helpBoxTitle, { color: colors.neutralForeground2 }]}>Demo OTP Code:</Text>
              <Text style={[styles.helpBoxText, { color: colors.neutralForeground3 }]}>
                Enter code: <Text style={{ fontWeight: 'bold' }}>123456</Text>
              </Text>
            </View>
          </View>
        )}

        {/* ================= SIGNUP STEP 3: INTERESTS ================= */}
        {currentStep === 'SIGNUP_INTERESTS' && (
          <View style={styles.formContainer}>
            <Text style={[styles.stepIndicator, { color: colors.brandForeground1 }]}>Step 3 of 5</Text>
            <Text style={[styles.titleText, { color: colors.neutralForeground1 }]}>Choose your interests</Text>
            <Text style={[styles.subtitleText, { color: colors.neutralForeground3 }]}>
              Select areas you care about. We will recommend volunteering opportunities matching these.
            </Text>

            <View style={styles.chipsContainer}>
              {[
                { label: 'Photography', icon: 'camera-outline' },
                { label: 'Content Creation', icon: 'videocam-outline' },
                { label: 'Tech', icon: 'laptop-outline' },
                { label: 'Arts & Craft', icon: 'brush-outline' },
                { label: 'Music & Performance', icon: 'musical-notes-outline' },
                { label: 'Sports & Fitness', icon: 'fitness-outline' },
                { label: 'Nature Exploration', icon: 'compass-outline' },
                { label: 'Reading & Writing', icon: 'book-outline' },
                { label: 'Public speaking', icon: 'megaphone-outline' },
                { label: 'Mentoring', icon: 'people-outline' },
                { label: 'Teaching', icon: 'school-outline' },
                { label: 'Management', icon: 'briefcase-outline' },
                { label: 'Research', icon: 'search-outline' },
                { label: 'On field stuff', icon: 'walk-outline' },
                { label: 'Animal Care', icon: 'paw-outline' },
              ].map((interest) => {
                const isSelected = formData.interests.includes(interest.label);
                return (
                  <Pressable
                    key={interest.label}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.brandBackground : colors.neutralBackground2,
                        borderColor: isSelected ? colors.brandForeground2 : colors.neutralStroke1,
                      },
                    ]}
                    onPress={() => {
                      const newInterests = isSelected
                        ? formData.interests.filter((i) => i !== interest.label)
                        : [...formData.interests, interest.label];
                      setFormData({ ...formData, interests: newInterests });
                    }}
                  >
                    <Ionicons
                      name={interest.icon as any}
                      size={16}
                      color={isSelected ? colors.neutralForegroundOnBrand : colors.neutralForeground2}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? colors.neutralForegroundOnBrand : colors.neutralForeground2,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {interest.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    formData.interests.length > 0 ? colors.brandBackground : colors.neutralBackgroundDisabled,
                  marginTop: Spacing.xl,
                },
              ]}
              disabled={formData.interests.length === 0}
              onPress={handleInterestsSubmit}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color: formData.interests.length > 0 ? colors.neutralForegroundOnBrand : colors.neutralForegroundDisabled,
                  },
                ]}
              >
                Continue
              </Text>
            </Pressable>
          </View>
        )}

        {/* ================= SIGNUP STEP 4: SUPERPOWER ================= */}
        {currentStep === 'SIGNUP_SUPERPOWER' && (
          <View style={styles.formContainer}>
            <Text style={[styles.stepIndicator, { color: colors.brandForeground1 }]}>Step 4 of 5</Text>
            <Text style={[styles.titleText, { color: colors.neutralForeground1 }]}>Volunteering Superpower</Text>
            <Text style={[styles.subtitleText, { color: colors.neutralForeground3 }]}>
              Help us understand your commitment level and preferences.
            </Text>

            {/* Question 1 */}
            <View style={styles.questionBlock}>
              <Text style={[styles.questionLabel, { color: colors.neutralForeground1 }]}>
                1. How much time can you commit?
              </Text>
              <View style={styles.optionsRow}>
                {['< 2 hrs/week', '2-5 hrs/week', '5+ hrs/week'].map((opt) => (
                  <Pressable
                    key={opt}
                    style={[
                      styles.optionPill,
                      {
                        backgroundColor: formData.timeCommitment === opt ? colors.brandBackground : colors.neutralBackground2,
                        borderColor: formData.timeCommitment === opt ? colors.brandForeground2 : colors.neutralStroke1,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, timeCommitment: opt })}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        {
                          color: formData.timeCommitment === opt ? colors.neutralForegroundOnBrand : colors.neutralForeground2,
                          fontWeight: formData.timeCommitment === opt ? '600' : '400',
                        },
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Question 2 */}
            <View style={styles.questionBlock}>
              <Text style={[styles.questionLabel, { color: colors.neutralForeground1 }]}>
                2. Preferred volunteering style?
              </Text>
              <View style={styles.optionsRow}>
                {['Remote', 'In-person', 'Hybrid'].map((opt) => (
                  <Pressable
                    key={opt}
                    style={[
                      styles.optionPill,
                      {
                        backgroundColor: formData.style === opt ? colors.brandBackground : colors.neutralBackground2,
                        borderColor: formData.style === opt ? colors.brandForeground2 : colors.neutralStroke1,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, style: opt })}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        {
                          color: formData.style === opt ? colors.neutralForegroundOnBrand : colors.neutralForeground2,
                          fontWeight: formData.style === opt ? '600' : '400',
                        },
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Question 3 */}
            <View style={styles.questionBlock}>
              <Text style={[styles.questionLabel, { color: colors.neutralForeground1 }]}>
                3. Do you have prior volunteering experience?
              </Text>
              <View style={styles.optionsRow}>
                {['Yes', 'No'].map((opt) => (
                  <Pressable
                    key={opt}
                    style={[
                      styles.optionPill,
                      {
                        backgroundColor: formData.experience === opt ? colors.brandBackground : colors.neutralBackground2,
                        borderColor: formData.experience === opt ? colors.brandForeground2 : colors.neutralStroke1,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, experience: opt })}
                  >
                    <Text
                      style={[
                        styles.optionPillText,
                        {
                          color: formData.experience === opt ? colors.neutralForegroundOnBrand : colors.neutralForeground2,
                          fontWeight: formData.experience === opt ? '600' : '400',
                        },
                      ]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor:
                    formData.timeCommitment && formData.style && formData.experience
                      ? colors.brandBackground
                      : colors.neutralBackgroundDisabled,
                  marginTop: Spacing.xl,
                },
              ]}
              disabled={!formData.timeCommitment || !formData.style || !formData.experience}
              onPress={handleSuperpowerSubmit}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  {
                    color:
                      formData.timeCommitment && formData.style && formData.experience
                        ? colors.neutralForegroundOnBrand
                        : colors.neutralForegroundDisabled,
                  },
                ]}
              >
                Continue
              </Text>
            </Pressable>
          </View>
        )}

        {/* ================= SIGNUP STEP 5: ROLE ================= */}
        {currentStep === 'SIGNUP_ROLE' && (
          <View style={styles.formContainer}>
            <Text style={[styles.stepIndicator, { color: colors.brandForeground1 }]}>Step 5 of 5</Text>
            <Text style={[styles.titleText, { color: colors.neutralForeground1 }]}>Which profile fits you best?</Text>

            <View style={styles.roleGridContainer}>
              {[
                { title: 'College Student', icon: 'school-outline' },
                { title: 'Working Professional', icon: 'briefcase-outline' },
                { title: 'Freelancer / Creative', icon: 'brush-outline' },
                { title: 'Other', icon: 'options-outline' },
              ].map((item) => {
                const isSelected = formData.role === item.title;
                return (
                  <Pressable
                    key={item.title}
                    style={[
                      styles.roleGridCard,
                      {
                        backgroundColor: colors.neutralBackground2,
                        borderColor: isSelected ? colors.brandForeground1 : colors.neutralStroke1,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, role: item.title })}
                  >
                    <View style={[styles.roleGridIconContainer, { backgroundColor: colors.brandBackgroundSubtle }]}>
                      <Ionicons name={item.icon as any} size={24} color={colors.brandForeground1} />
                    </View>
                    <Text style={[styles.roleGridTitle, { color: colors.neutralForeground1 }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[
                styles.primaryButton,
                {
                  backgroundColor: formData.role ? colors.brandBackground : colors.neutralBackgroundDisabled,
                  marginTop: Spacing.xl,
                },
              ]}
              disabled={!formData.role || loading}
              onPress={() => handleRoleSubmit(formData.role)}
            >
              {loading ? (
                <ActivityIndicator color={colors.neutralForegroundOnBrand} />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    {
                      color: formData.role ? colors.neutralForegroundOnBrand : colors.neutralForegroundDisabled,
                    },
                  ]}
                >
                  Complete Setup
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {/* ================= SUCCESS SCREEN ================= */}
        {currentStep === 'SUCCESS' && (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeTextSection}>
              <View style={[styles.successIconWrapper, { backgroundColor: colors.successBackgroundSubtle }]}>
                <Ionicons name="checkmark-circle" size={64} color={colors.successForeground1} />
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.neutralForeground1, marginTop: Spacing.m }]}>
                Setup Complete!
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.neutralForeground3 }]}>
                Welcome to Social Workers, {formData.fullName}. Your volunteer dashboard is ready. Let's start making an impact!
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.brandBackground }]}
                onPress={finishOnboarding}
              >
                <Text style={[styles.primaryButtonText, { color: colors.neutralForegroundOnBrand }]}>
                  Go to Dashboard
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    paddingTop: Spacing.s,
    paddingBottom: Spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    padding: Spacing.xxs,
  },
  headerTitle: {
    ...Typography.bodyStrong,
    fontSize: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.l,
    paddingBottom: Spacing.xxl,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xxl,
  },
  welcomeTextSection: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  logoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.l,
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    ...Typography.title,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.s,
  },
  welcomeSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.s,
    lineHeight: 22,
  },
  buttonContainer: {
    gap: Spacing.m,
    width: '100%',
    marginTop: Spacing.xxl,
  },
  primaryButton: {
    height: 50,
    borderRadius: Shapes.rounded,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  primaryButtonText: {
    ...Typography.bodyStrong,
    fontSize: 16,
  },
  secondaryButton: {
    height: 50,
    borderRadius: Shapes.rounded,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    ...Typography.bodyStrong,
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
    paddingTop: Spacing.l,
  },
  stepIndicator: {
    ...Typography.captionStrong,
    marginBottom: Spacing.xxs,
    textTransform: 'uppercase',
  },
  titleText: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  subtitleText: {
    ...Typography.body,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.m,
    borderRadius: Shapes.rounded,
    marginBottom: Spacing.l,
    gap: Spacing.s,
  },
  errorBoxText: {
    ...Typography.bodyStrong,
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.l,
  },
  label: {
    ...Typography.captionStrong,
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Shapes.rounded,
    height: 48,
    paddingHorizontal: Spacing.s,
  },
  inputIcon: {
    marginRight: Spacing.s,
  },
  atSymbol: {
    ...Typography.bodyStrong,
    fontSize: 16,
    marginRight: Spacing.xxs,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    padding: Spacing.xxs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: Spacing.xs,
  },
  forgotPasswordText: {
    ...Typography.captionStrong,
  },
  helpBox: {
    marginTop: Spacing.xxl,
    padding: Spacing.m,
    borderRadius: Shapes.rounded,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  helpBoxTitle: {
    ...Typography.captionStrong,
    marginBottom: Spacing.xxs,
  },
  helpBoxText: {
    ...Typography.caption,
  },
  checklistContainer: {
    marginTop: Spacing.s,
    gap: Spacing.xxs,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  checkText: {
    ...Typography.caption,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.caption,
    marginHorizontal: Spacing.s,
  },
  oauthRow: {
    flexDirection: 'row',
    gap: Spacing.m,
  },
  oauthButton: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    borderRadius: Shapes.rounded,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.s,
  },
  oauthText: {
    ...Typography.bodyStrong,
    fontSize: 14,
  },
  consentSection: {
    marginTop: Spacing.m,
    gap: Spacing.m,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s,
  },
  checkboxLabel: {
    ...Typography.body,
    fontSize: 14,
  },
  otpInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.l,
  },
  otpBox: {
    width: 44,
    height: 48,
    borderWidth: 1.5,
    borderRadius: Shapes.rounded,
    textAlign: 'center',
    ...Typography.subtitle,
    fontSize: 20,
  },
  timerRow: {
    alignItems: 'center',
    marginTop: Spacing.s,
  },
  timerText: {
    ...Typography.caption,
  },
  resendLink: {
    ...Typography.captionStrong,
    textDecorationLine: 'underline',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
    marginVertical: Spacing.s,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.s,
    paddingVertical: Spacing.xs,
    borderRadius: Shapes.circular,
    borderWidth: 1,
  },
  chipText: {
    ...Typography.caption,
    fontSize: 13,
  },
  questionBlock: {
    marginBottom: Spacing.xl,
  },
  questionLabel: {
    ...Typography.bodyStrong,
    fontSize: 15,
    marginBottom: Spacing.s,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.s,
  },
  optionPill: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    borderRadius: Shapes.circular,
    borderWidth: 1.5,
  },
  optionPillText: {
    ...Typography.caption,
    fontSize: 13,
  },
  cardsColumn: {
    gap: Spacing.m,
  },
  roleCard: {
    flexDirection: 'row',
    padding: Spacing.m,
    borderRadius: Shapes.rounded,
    alignItems: 'center',
    gap: Spacing.m,
  },
  roleCardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCardTextSection: {
    flex: 1,
  },
  roleCardTitle: {
    ...Typography.bodyStrong,
    fontSize: 15,
    marginBottom: 2,
  },
  roleCardDesc: {
    ...Typography.caption,
    lineHeight: 16,
  },
  roleGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.m,
  },
  roleGridCard: {
    width: '48%',
    aspectRatio: 1.05,
    borderRadius: Shapes.rounded,
    padding: Spacing.s,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.s,
  },
  roleGridIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  roleGridTitle: {
    ...Typography.bodyStrong,
    fontSize: 12.5,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
