# 당근마켓 클론 🥕

React Native (Expo) + TypeScript + expo-router 로 만든 당근마켓 중고거래 클론 앱입니다.

## 실행 방법

```bash
npm install        # 최초 1회
npx expo start     # 개발 서버 실행
```

개발 서버가 뜨면:

- **Android**: 터미널에서 `a` (에뮬레이터) 또는 Expo Go 앱으로 QR 스캔
- **iOS**: `i` (시뮬레이터, macOS) 또는 Expo Go 앱으로 QR 스캔
- **웹 미리보기**: `w`

## 구현된 기능

- **하단 탭 5개**: 홈 · 동네생활 · 내 근처 · 채팅 · 나의 당근
- **홈 피드**: 중고 상품 목록, 동네/시간/가격/관심·채팅 수, `글쓰기` 플로팅 버튼
- **상품 상세**: 이미지 캐러셀, 판매자 매너온도, 관심(하트) 토글, `채팅하기`
- **글쓰기**: 사진 추가, 제목·가격·나눔·카테고리·설명 입력 → 피드 상단에 즉시 반영
- **채팅**: 채팅 목록(안읽음 배지) + 채팅방(말풍선, 상품 요약 바, 메시지 전송)
- **동네생활 / 내 근처 / 나의 당근**: 당근 스타일 UI

## 구조

```
src/
  app/                     # expo-router 파일 기반 라우팅
    _layout.tsx            # 루트 Stack + 전역 Provider
    (tabs)/                # 하단 탭 (index, community, near, chat, my)
    product/[id].tsx       # 상품 상세
    chat/[id].tsx          # 채팅방
    new.tsx                # 글쓰기 (모달)
  components/ProductCard.tsx
  store/AppStore.tsx       # 상품·채팅 전역 상태 (Context)
  data/                    # 목데이터 & 타입
  lib/format.ts            # 가격/숫자 포맷
  theme/karrot.ts          # 당근 브랜드 컬러
```

> 상품/채팅 데이터는 앱 메모리(Context)에 저장되며, 실제 백엔드는 연결돼 있지 않습니다. 이미지는 데모용 원격 플레이스홀더(picsum/pravatar)를 사용하므로 첫 로딩 시 인터넷 연결이 필요합니다.
