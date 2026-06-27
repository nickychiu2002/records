import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
  Platform,
  StyleSheet,
  Modal,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useBudget } from '@/lib/budget-context';
import { useColors } from '@/hooks/use-colors';
import { Category } from '@/constants/budget';
import * as Haptics from 'expo-haptics';

// Preset color palette for category customization
const COLOR_PALETTE = [
  '#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF',
  '#845EC2', '#FF9671', '#F9F871', '#00C9A7', '#C34B4B',
  '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F1948A',
  '#82E0AA', '#F0B27A', '#AED6F1', '#A9CCE3', '#9CA3AF',
];

export default function SettingsScreen() {
  const colors = useColors();
  const { googleSheet, updateGoogleSheet, expenseCategories, incomeCategories } = useBudget();

  const [spreadsheetId, setSpreadsheetId] = useState(googleSheet.spreadsheetId);
  const [apiKey, setApiKey] = useState(googleSheet.apiKey);
  const [sheetName, setSheetName] = useState(googleSheet.sheetName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveGoogleSheet = useCallback(async () => {
    setIsSaving(true);
    try {
      await updateGoogleSheet({ spreadsheetId, apiKey, sheetName });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✓ 已儲存', 'Google Sheet 設定已更新');
    } catch {
      Alert.alert('儲存失敗', '請稍後再試');
    } finally {
      setIsSaving(false);
    }
  }, [spreadsheetId, apiKey, sheetName, updateGoogleSheet]);

  const handleToggleEnabled = useCallback(async (value: boolean) => {
    if (value && (!spreadsheetId || !apiKey)) {
      Alert.alert('提示', '請先填入 Spreadsheet ID 和 API Key');
      return;
    }
    await updateGoogleSheet({ enabled: value });
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [spreadsheetId, apiKey, updateGoogleSheet]);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={[styles.pageHeader, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>設定</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 }}>
            Google Sheet 連線與類別管理
          </Text>
        </View>

        {/* Google Sheet Section */}
        <SectionCard title="Google Sheet 連線" colors={colors}>
          {/* Enable Toggle */}
          <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '500' }}>
                啟用同步
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                {googleSheet.enabled ? '✅ 已連線' : '⭕ 未啟用'}
              </Text>
            </View>
            <Switch
              value={googleSheet.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Spreadsheet ID */}
          <SettingInput
            label="Spreadsheet ID"
            placeholder="輸入 Google Sheet ID"
            value={spreadsheetId}
            onChangeText={setSpreadsheetId}
            hint="從 Google Sheet URL 中取得"
            colors={colors}
          />

          {/* API Key */}
          <SettingInput
            label="API Key"
            placeholder="輸入 Google Sheets API Key"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            hint="從 Google Cloud Console 取得"
            colors={colors}
          />

          {/* Sheet Name */}
          <SettingInput
            label="工作表名稱"
            placeholder="Sheet1"
            value={sheetName}
            onChangeText={setSheetName}
            hint="預設為 Sheet1"
            colors={colors}
          />

          {/* Save Button */}
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary, opacity: pressed || isSaving ? 0.8 : 1 },
            ]}
            onPress={handleSaveGoogleSheet}
            disabled={isSaving}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
              {isSaving ? '儲存中...' : '儲存設定'}
            </Text>
          </Pressable>

          {/* Instructions */}
          <View style={[styles.infoBox, { backgroundColor: colors.background }]}>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>
              📋 設定步驟：{'\n'}
              1. 前往 Google Cloud Console 建立 API Key{'\n'}
              2. 啟用 Google Sheets API{'\n'}
              3. 建立 Google Sheet 並複製 ID（URL 中 /d/ 後的部分）{'\n'}
              4. 確保試算表第一列為標題行
            </Text>
          </View>
        </SectionCard>

        {/* Expense Categories */}
        <SectionCard title="支出類別顏色" colors={colors}>
          <CategoryColorList categories={expenseCategories} colors={colors} />
        </SectionCard>

        {/* Income Categories */}
        <SectionCard title="收入類別顏色" colors={colors}>
          <CategoryColorList categories={incomeCategories} colors={colors} />
        </SectionCard>

        {/* App Info */}
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>記帳本 v1.0.0</Text>
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
            資料儲存於本機裝置
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function CategoryColorList({ categories, colors }: { categories: Category[]; colors: ReturnType<typeof useColors> }) {
  const { updateCategoryColor } = useBudget();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <View style={{ gap: 8 }}>
      {categories.map((cat) => (
        <View
          key={cat.id}
          style={[styles.catRow, { backgroundColor: colors.background }]}
        >
          <Pressable
            style={[styles.colorSwatch, { backgroundColor: cat.color }]}
            onPress={() => setEditingId(cat.id)}
          >
            <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>✏️</Text>
          </Pressable>
          <Text style={{ fontSize: 18, marginHorizontal: 8 }}>{cat.icon}</Text>
          <Text style={{ flex: 1, color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
            {cat.name}
          </Text>
          <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
        </View>
      ))}

      {editingId && (
        <ColorPickerModal
          categoryId={editingId}
          currentColor={categories.find((c) => c.id === editingId)?.color ?? '#999'}
          onSelect={async (color) => {
            await updateCategoryColor(editingId, color);
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setEditingId(null);
          }}
          onClose={() => setEditingId(null)}
          colors={colors}
        />
      )}
    </View>
  );
}

function ColorPickerModal({
  categoryId,
  currentColor,
  onSelect,
  onClose,
  colors,
}: {
  categoryId: string;
  currentColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [selected, setSelected] = useState(currentColor);
  const [customHex, setCustomHex] = useState(currentColor);

  const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex);

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.colorPickerContainer, { backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
            選擇顏色
          </Text>

          {/* Preview */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={[styles.colorPreview, { backgroundColor: selected }]} />
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{selected}</Text>
          </View>

          {/* Palette Grid */}
          <View style={styles.paletteGrid}>
            {COLOR_PALETTE.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.paletteItem,
                  { backgroundColor: color },
                  selected === color && styles.paletteItemSelected,
                ]}
                onPress={() => {
                  setSelected(color);
                  setCustomHex(color);
                }}
              >
                {selected === color && (
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* Custom Hex Input */}
          <View style={{ marginTop: 12, marginBottom: 16 }}>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>
              自訂 HEX 色碼
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={[styles.hexPreviewDot, { backgroundColor: isValidHex(customHex) ? customHex : '#ccc' }]} />
              <TextInput
                style={[styles.hexInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                value={customHex}
                onChangeText={(v) => {
                  const hex = v.startsWith('#') ? v : `#${v}`;
                  setCustomHex(hex);
                  if (isValidHex(hex)) setSelected(hex);
                }}
                placeholder="#FF6B6B"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                maxLength={7}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: colors.background, flex: 1 }]}
              onPress={onClose}
            >
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '500' }}>取消</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1 }]}
              onPress={() => onSelect(selected)}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>套用</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SectionCard({ title, children, colors }: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
      <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700', marginBottom: 14 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function SettingInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  hint,
  colors,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  hint?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '500', marginBottom: 5 }}>
        {label}
      </Text>
      <TextInput
        style={[styles.textInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />
      {hint && (
        <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  sectionCard: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 0.5,
  },
  textInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  infoBox: {
    borderRadius: 10,
    padding: 12,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  colorPickerContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
  },
  colorPreview: {
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  paletteItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteItemSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  hexPreviewDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  hexInput: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    borderWidth: 1,
  },
  modalBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
