import { ChatRoom } from './types';

const img = (seed: string) => `https://picsum.photos/seed/${seed}/700/700`;
const avatar = (n: number) => `https://i.pravatar.cc/150?img=${n}`;

export const CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'c1',
    productId: '1',
    productTitle: '아이폰 14 Pro 256GB 딥퍼플 팝니다',
    productImage: img('iphone14'),
    productPrice: 780000,
    peer: { name: '동네주민', location: '역삼동', avatar: avatar(20) },
    lastMessage: '혹시 지금 거래 가능하실까요?',
    timeAgo: '방금 전',
    unread: 2,
    messages: [
      { id: 'm1', text: '안녕하세요! 아이폰 아직 판매하시나요?', fromMe: false, time: '오후 2:31' },
      { id: 'm2', text: '네 아직 판매중입니다 :)', fromMe: true, time: '오후 2:33' },
      { id: 'm3', text: '배터리 성능은 몇 프로인가요?', fromMe: false, time: '오후 2:34' },
      { id: 'm4', text: '91%입니다! 상태 정말 좋아요', fromMe: true, time: '오후 2:35' },
      { id: 'm5', text: '혹시 지금 거래 가능하실까요?', fromMe: false, time: '오후 2:40' },
    ],
  },
  {
    id: 'c2',
    productId: '5',
    productTitle: '유아용 원목 장난감 모음 (일괄)',
    productImage: img('toys'),
    productPrice: 20000,
    peer: { name: '세아이맘', location: '역삼동', avatar: avatar(48) },
    lastMessage: '내일 오전에 찾으러 갈게요~',
    timeAgo: '30분 전',
    unread: 0,
    messages: [
      { id: 'm1', text: '장난감 상태 사진 더 볼 수 있을까요?', fromMe: false, time: '오전 11:10' },
      { id: 'm2', text: '네 잠시만요, 사진 보내드릴게요', fromMe: true, time: '오전 11:12' },
      { id: 'm3', text: '내일 오전에 찾으러 갈게요~', fromMe: false, time: '오전 11:20' },
    ],
  },
  {
    id: 'c3',
    productId: '7',
    productTitle: '닌텐도 스위치 OLED + 게임 3종',
    productImage: img('switch'),
    productPrice: 320000,
    peer: { name: '게임하자', location: '청담동', avatar: avatar(8) },
    lastMessage: '넵 감사합니다! 후기 남길게요 😊',
    timeAgo: '어제',
    unread: 0,
    messages: [
      { id: 'm1', text: '거래 감사했습니다!', fromMe: true, time: '오후 6:02' },
      { id: 'm2', text: '넵 감사합니다! 후기 남길게요 😊', fromMe: false, time: '오후 6:05' },
    ],
  },
];
