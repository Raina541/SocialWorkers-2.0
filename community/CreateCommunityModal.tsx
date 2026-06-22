import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, Typography, Shapes } from '../constants/Theme';
import { Ionicons } from '@expo/vector-icons';

interface CreateCommunityModalProps {
  visible: boolean;
  isDarkMode?: boolean;
  onClose: () => void;
  onCreate: (name: string, location: string, description: string) => void;
  onViewExisting: () => void;
}

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  visible,
  isDarkMode = false,
  onClose,
  onCreate,
  onViewExisting,
}) => {
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [showGuardrail, setShowGuardrail] = useState(false);

  const handleSubmit = () => {
    if (!name.trim() || !location.trim()) return;

    // Guardrail check: if name contains pet/animal keywords and location matches residential society terms
    const isPetQuery = /pet|animal|dog|cat|paw/i.test(name);
    const isSocietyQuery = /society|apartment|complex|condo|colony|enclave/i.test(location);

    if (isPetQuery && isSocietyQuery) {
      setShowGuardrail(true);
    } else {
      onCreate(name.trim(), location.trim(), description.trim());
      handleReset();
    }
  };

  const handleReset = () => {
    setName('');
    setLocation('');
    setDescription('');
    setShowGuardrail(false);
    onClose();
  };

  const handleCreateAnyway = () => {
    onCreate(name.trim(), location.trim(), description.trim());
    handleReset();
  };

  const handleViewExisting = () => {
    onViewExisting();
    handleReset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalContainer, { backgroundColor: themeColors.neutralBackground1 }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: themeColors.neutralStroke2 }]}>
            <Text style={[Typography.subtitle, { color: themeColors.neutralForeground1 }]}>
              Create Community
            </Text>
            <Pressable onPress={handleReset} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={themeColors.neutralForeground1} />
            </Pressable>
          </View>

          {!showGuardrail ? (
            <ScrollView contentContainerStyle={styles.formContent}>
              <Text style={[styles.label, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
                Community Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Pet Care Society, Green Warriors"
                placeholderTextColor={themeColors.neutralForegroundDisabled}
                style={[
                  styles.input,
                  {
                    color: themeColors.neutralForeground1,
                    backgroundColor: themeColors.neutralBackground2,
                    borderColor: themeColors.neutralStroke1,
                  },
                ]}
              />

              <Text style={[styles.label, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
                Locality / Society *
              </Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Grand Arch Society, Gwalior Heights"
                placeholderTextColor={themeColors.neutralForegroundDisabled}
                style={[
                  styles.input,
                  {
                    color: themeColors.neutralForeground1,
                    backgroundColor: themeColors.neutralBackground2,
                    borderColor: themeColors.neutralStroke1,
                  },
                ]}
              />

              <Text style={[styles.label, Typography.bodyStrong, { color: themeColors.neutralForeground1 }]}>
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What is this community about? Who should join?"
                placeholderTextColor={themeColors.neutralForegroundDisabled}
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    color: themeColors.neutralForeground1,
                    backgroundColor: themeColors.neutralBackground2,
                    borderColor: themeColors.neutralStroke1,
                  },
                ]}
                multiline
                numberOfLines={4}
              />

              <Pressable
                onPress={handleSubmit}
                disabled={!name.trim() || !location.trim()}
                style={[
                  styles.submitButton,
                  {
                    backgroundColor:
                      name.trim() && location.trim()
                        ? themeColors.brandForeground1
                        : themeColors.neutralBackground2,
                  },
                ]}
              >
                <Text style={styles.submitButtonText}>Create Community</Text>
              </Pressable>
            </ScrollView>
          ) : (
            /* Already Exists Guardrail Screen */
            <View style={styles.guardrailContent}>
              <View
                style={[
                  styles.guardrailCard,
                  {
                    backgroundColor: isDarkMode ? '#2c1417' : '#fdf3f4',
                    borderColor: isDarkMode ? '#7a1c22' : '#f8d7da',
                  },
                ]}
              >
                <Ionicons
                  name="warning"
                  size={36}
                  color={isDarkMode ? '#e05c63' : '#c41818'}
                  style={styles.guardrailIcon}
                />
                <Text
                  style={[
                    Typography.bodyStrong,
                    styles.guardrailTitle,
                    { color: isDarkMode ? '#e05c63' : '#c41818' },
                  ]}
                >
                  Existing Community Found
                </Text>
                <Text style={[Typography.body, styles.guardrailText, { color: themeColors.neutralForeground1 }]}>
                  There is already a community dealing with pet care in your society (e.g. "Pet Lovers Club"). Join it to connect with them, or would you still like to create a new one?
                </Text>
              </View>

              <View style={styles.guardrailActions}>
                <Pressable
                  onPress={handleViewExisting}
                  style={[styles.actionButton, { backgroundColor: themeColors.brandForeground1 }]}
                >
                  <Text style={styles.actionButtonText}>View Existing Community</Text>
                </Pressable>

                <Pressable
                  onPress={handleCreateAnyway}
                  style={[
                    styles.actionButton,
                    styles.outlineButton,
                    { borderColor: themeColors.neutralStroke1 },
                  ]}
                >
                  <Text style={[styles.actionButtonText, { color: themeColors.neutralForeground1 }]}>
                    Create Anyway
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.m,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  formContent: {
    padding: Spacing.m,
  },
  label: {
    fontSize: 12,
    marginBottom: Spacing.xs,
    marginTop: Spacing.s,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: Shapes.rounded,
    paddingHorizontal: Spacing.s,
    fontSize: 14,
    marginBottom: Spacing.s,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingVertical: Spacing.s,
  },
  submitButton: {
    height: 44,
    borderRadius: Shapes.rounded,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.l,
    marginBottom: Spacing.xl,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  guardrailContent: {
    padding: Spacing.m,
    alignItems: 'center',
  },
  guardrailCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.m,
    alignItems: 'center',
    marginBottom: Spacing.l,
    marginTop: Spacing.s,
  },
  guardrailIcon: {
    marginBottom: Spacing.xs,
  },
  guardrailTitle: {
    fontSize: 16,
    marginBottom: Spacing.s,
  },
  guardrailText: {
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13,
  },
  guardrailActions: {
    width: '100%',
    gap: Spacing.s,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    height: 44,
    borderRadius: Shapes.rounded,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
