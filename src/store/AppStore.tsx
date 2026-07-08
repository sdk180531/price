import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PRODUCTS } from '@/data/products';
import { CHAT_ROOMS } from '@/data/chats';
import { ChatRoom, Message, Product } from '@/data/types';

interface NewProductInput {
  title: string;
  price: number;
  description: string;
  category: string;
  images: string[];
}

interface AppState {
  products: Product[];
  chats: ChatRoom[];
  totalUnread: number;
  addProduct: (input: NewProductInput) => Product;
  toggleLike: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  getChat: (id: string) => ChatRoom | undefined;
  sendMessage: (chatId: string, text: string) => void;
  openChatForProduct: (product: Product) => string;
  markRead: (chatId: string) => void;
}

const AppContext = createContext<AppState | null>(null);

let idSeq = 1000;

function nowTime(): string {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${m}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [chats, setChats] = useState<ChatRoom[]>(CHAT_ROOMS);

  const addProduct = useCallback((input: NewProductInput) => {
    const id = `u${idSeq++}`;
    const product: Product = {
      id,
      title: input.title,
      price: input.price,
      description: input.description,
      category: input.category || '중고물품',
      location: '역삼동',
      timeAgo: '방금 전',
      images: input.images.length ? input.images : [`https://picsum.photos/seed/${id}/700/700`],
      seller: {
        name: '나',
        location: '역삼동',
        temperature: 36.5,
        avatar: 'https://i.pravatar.cc/150?img=68',
      },
      likes: 0,
      chats: 0,
      views: 1,
      status: '판매중',
      liked: false,
    };
    setProducts((prev) => [product, ...prev]);
    return product;
  }, []);

  const toggleLike = useCallback((id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p,
      ),
    );
  }, []);

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products]);
  const getChat = useCallback((id: string) => chats.find((c) => c.id === id), [chats]);

  const sendMessage = useCallback((chatId: string, text: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        const msg: Message = { id: `m${Date.now()}`, text, fromMe: true, time: nowTime() };
        return { ...c, messages: [...c.messages, msg], lastMessage: text, timeAgo: '방금 전' };
      }),
    );
  }, []);

  const markRead = useCallback((chatId: string) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)));
  }, []);

  const openChatForProduct = useCallback(
    (product: Product) => {
      const existing = chats.find((c) => c.productId === product.id);
      if (existing) return existing.id;
      const id = `c${idSeq++}`;
      const room: ChatRoom = {
        id,
        productId: product.id,
        productTitle: product.title,
        productImage: product.images[0],
        productPrice: product.price,
        peer: {
          name: product.seller.name,
          location: product.seller.location,
          avatar: product.seller.avatar,
        },
        lastMessage: '',
        timeAgo: '방금 전',
        unread: 0,
        messages: [
          { id: 'init', text: `${product.title}\n아직 판매하시나요?`, fromMe: true, time: nowTime() },
        ],
      };
      setChats((prev) => [room, ...prev]);
      return id;
    },
    [chats],
  );

  const totalUnread = useMemo(() => chats.reduce((sum, c) => sum + c.unread, 0), [chats]);

  const value = useMemo<AppState>(
    () => ({
      products,
      chats,
      totalUnread,
      addProduct,
      toggleLike,
      getProduct,
      getChat,
      sendMessage,
      openChatForProduct,
      markRead,
    }),
    [products, chats, totalUnread, addProduct, toggleLike, getProduct, getChat, sendMessage, openChatForProduct, markRead],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
