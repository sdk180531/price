export type ProductStatus = '판매중' | '예약중' | '거래완료';

export interface Seller {
  name: string;
  location: string;
  temperature: number; // 매너온도
  avatar: string;
}

export interface Product {
  id: string;
  title: string;
  price: number; // 0 이면 나눔
  description: string;
  category: string;
  location: string;
  timeAgo: string;
  images: string[];
  seller: Seller;
  likes: number;
  chats: number;
  views: number;
  status: ProductStatus;
  liked?: boolean;
}

export interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
}

export interface ChatRoom {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  peer: { name: string; location: string; avatar: string };
  lastMessage: string;
  timeAgo: string;
  unread: number;
  messages: Message[];
}
