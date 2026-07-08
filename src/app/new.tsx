import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/store/AppStore';
import { KarrotColors, Radius } from '@/theme/karrot';

const CATEGORIES = ['디지털기기', '가구/인테리어', '패션/잡화', '유아동', '생활/주방', '스포츠/레저'];

export default function NewProductScreen() {
  const { addProduct } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const canSubmit = title.trim().length > 0 && (isFree || price.trim().length > 0);

  const MAX_PHOTOS = 10;
  const notify = (msg: string) =>
    Platform.OS === 'web' ? window.alert(msg) : Alert.alert(msg);

  // 앨범을 열어 선택한 사진만 추가한다. (선택/취소를 사용자가 결정)
  const addPhoto = async () => {
    const remaining = MAX_PHOTOS - images.length;
    if (remaining <= 0) {
      notify(`사진은 최대 ${MAX_PHOTOS}장까지 추가할 수 있어요.`);
      return;
    }

    // 사진첩 접근 권한 요청 (웹은 파일 선택창이라 권한이 필요 없음)
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        notify('앨범에서 사진을 선택하려면 사진 접근 권한을 허용해주세요.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    // 사용자가 아무것도 선택하지 않고 닫으면 추가하지 않는다.
    if (result.canceled || !result.assets?.length) return;

    const uris = result.assets.map((a) => a.uri);
    setImages((prev) => [...prev, ...uris].slice(0, MAX_PHOTOS));
  };

  const submit = () => {
    if (!canSubmit) return;
    addProduct({
      title: title.trim(),
      price: isFree ? 0 : Number(price.replace(/[^0-9]/g, '')) || 0,
      description: description.trim() || '상품 설명이 없습니다.',
      category,
      images,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={KarrotColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>중고거래 글쓰기</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* 사진 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoRow}
        >
          <Pressable nativeID="photo-add-btn" style={styles.photoAdd} onPress={addPhoto}>
            <Ionicons name="camera-outline" size={24} color={KarrotColors.subText} />
            <Text style={styles.photoAddText}>{images.length}/{MAX_PHOTOS}</Text>
          </Pressable>
          {images.map((uri, i) => (
            <View key={i} style={styles.photoThumb}>
              <Image source={uri} style={styles.photoImg} contentFit="cover" />
              <Pressable
                style={styles.photoRemove}
                onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                hitSlop={6}
              >
                <Ionicons name="close-circle" size={20} color="#333" />
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {/* 제목 */}
        <View style={styles.field}>
          <TextInput
            style={styles.titleInput}
            placeholder="글 제목"
            placeholderTextColor={KarrotColors.lightText}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* 가격 */}
        <View style={styles.field}>
          <View style={styles.priceRow}>
            <Text style={styles.won}>₩</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="가격 (선택사항)"
              placeholderTextColor={KarrotColors.lightText}
              keyboardType="number-pad"
              value={isFree ? '' : price}
              editable={!isFree}
              onChangeText={setPrice}
            />
          </View>
          <Pressable style={styles.freeToggle} onPress={() => setIsFree((v) => !v)}>
            <Ionicons
              name={isFree ? 'checkbox' : 'square-outline'}
              size={20}
              color={isFree ? KarrotColors.primary : KarrotColors.lightText}
            />
            <Text style={[styles.freeText, isFree && { color: KarrotColors.primary }]}>나눔</Text>
          </Pressable>
        </View>

        {/* 카테고리 */}
        <View style={styles.field}>
          <Text style={styles.label}>카테고리</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <Pressable
                  key={c}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(active ? '' : c)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 설명 */}
        <View style={[styles.field, { borderBottomWidth: 0 }]}>
          <TextInput
            style={styles.descInput}
            placeholder="역삼동에 올릴 게시글 내용을 작성해 주세요.&#10;(판매 금지 물품은 게시가 제한될 수 있어요.)"
            placeholderTextColor={KarrotColors.lightText}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* 완료 버튼 */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable
          style={[styles.submit, !canSubmit && { backgroundColor: KarrotColors.lightText }]}
          onPress={submit}
          disabled={!canSubmit}
        >
          <Text style={styles.submitText}>작성 완료</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KarrotColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KarrotColors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: KarrotColors.text },
  photoRow: { padding: 16, gap: 10 },
  photoAdd: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: KarrotColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddText: { fontSize: 12, color: KarrotColors.subText, marginTop: 3 },
  photoThumb: { width: 72, height: 72 },
  photoImg: { width: 72, height: 72, borderRadius: Radius.md, backgroundColor: KarrotColors.lightBorder },
  photoRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 10 },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 8,
    borderBottomColor: KarrotColors.bgGray,
  },
  titleInput: { fontSize: 16, color: KarrotColors.text, padding: 0 },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  won: { fontSize: 17, color: KarrotColors.text, marginRight: 6 },
  priceInput: { flex: 1, fontSize: 16, color: KarrotColors.text, padding: 0 },
  freeToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  freeText: { fontSize: 14, color: KarrotColors.subText },
  label: { fontSize: 14, fontWeight: '600', color: KarrotColors.text, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: KarrotColors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: KarrotColors.primarySoft, borderColor: KarrotColors.primary },
  chipText: { fontSize: 13, color: KarrotColors.subText },
  chipTextActive: { color: KarrotColors.primary, fontWeight: '600' },
  descInput: { fontSize: 16, color: KarrotColors.text, minHeight: 160, lineHeight: 23, padding: 0 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KarrotColors.border,
    backgroundColor: '#fff',
  },
  submit: {
    backgroundColor: KarrotColors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
