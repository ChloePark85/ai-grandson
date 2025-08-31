"use client";

import { Button } from "@/components/ui/button";
import * as React from "react";
import { useState, useEffect } from "react";
import { Conversation } from "@11labs/client";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Grid3x3,
  UserPlus,
  MoreVertical
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

async function requestMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch {
    console.error("Microphone permission denied");
    return false;
  }
}

async function getSignedUrl(): Promise<string> {
  const response = await fetch("/api/signed-url");
  if (!response.ok) {
    throw Error("Failed to get signed url");
  }
  const data = await response.json();
  return data.signedUrl;
}

export function PhoneCallUI() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showKeypad, setShowKeypad] = useState(false);
  const [isIncoming, setIsIncoming] = useState(true);
  const [isAnswered, setIsAnswered] = useState(false);

  // 통화 시간 포맷팅
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 통화 시간 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && isAnswered) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected, isAnswered]);

  async function startConversation() {
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert("마이크 권한이 필요합니다");
      return;
    }
    
    setIsAnswered(true);
    setIsIncoming(false);
    
    const signedUrl = await getSignedUrl();
    const conversation = await Conversation.startSession({
      signedUrl: signedUrl,
      onConnect: () => {
        setIsConnected(true);
        setIsSpeaking(true);
      },
      onDisconnect: () => {
        setIsConnected(false);
        setIsSpeaking(false);
        setCallDuration(0);
        setIsAnswered(false);
        setIsIncoming(true);
      },
      onError: (error) => {
        console.log(error);
        alert("통화 연결 중 오류가 발생했습니다");
      },
      onModeChange: ({ mode }) => {
        setIsSpeaking(mode === "speaking");
      },
    });
    setConversation(conversation);
  }

  async function endConversation() {
    if (!conversation) {
      return;
    }
    await conversation.endSession();
    setConversation(null);
    setIsAnswered(false);
    setCallDuration(0);
    setIsIncoming(true);
  }

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // 실제 음소거 구현 필요
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // 실제 스피커폰 구현 필요
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-black flex flex-col">
      {/* 상태바 영역 */}
      <div className="h-12 flex items-center justify-center text-white/70 text-sm">
        {isConnected && isAnswered ? (
          <span className="text-green-400">통화 중</span>
        ) : isIncoming ? (
          <span className="text-white animate-pulse">수신 중...</span>
        ) : (
          <span className="text-yellow-400">연결 중...</span>
        )}
      </div>

      {/* 상대방 정보 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* 프로필 이미지 */}
          <div className="relative mb-6">
            <div className="relative w-32 h-32 mx-auto">
              <Image
                src="/boy.png"
                alt="AI 손자"
                fill
                className="rounded-full object-cover border-4 border-white/20"
                priority
              />
              {/* 말하는 중 표시 */}
              {isSpeaking && isConnected && (
                <div className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-30"></div>
              )}
            </div>
          </div>

          {/* 이름 */}
          <h2 className="text-3xl font-bold text-white mb-2">AI 손자</h2>
          
          {/* 전화번호 */}
          <p className="text-gray-400 mb-4">010-AI-손자</p>

          {/* 통화 시간 */}
          {isConnected && isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-mono text-white"
            >
              {formatDuration(callDuration)}
            </motion.div>
          )}

          {/* 통화 상태 메시지 */}
          {!isAnswered && isIncoming && (
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg text-gray-300 mt-4"
            >
              손자가 전화를 걸어왔어요
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* 하단 컨트롤 영역 */}
      <div className="pb-8 px-6">
        {!isAnswered && isIncoming ? (
          /* 수신 화면 버튼 */
          <div className="flex justify-around items-center mb-8">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={endConversation}
              className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg"
            >
              <PhoneOff className="w-8 h-8 text-white" />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startConversation}
              className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center shadow-lg animate-pulse"
            >
              <Phone className="w-8 h-8 text-white" />
            </motion.button>
          </div>
        ) : (
          /* 통화 중 컨트롤 버튼 */
          <>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* 음소거 */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center ${
                  isMuted ? 'bg-white text-gray-900' : 'bg-gray-700 text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </motion.button>

              {/* 키패드 */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowKeypad(!showKeypad)}
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center ${
                  showKeypad ? 'bg-white text-gray-900' : 'bg-gray-700 text-white'
                }`}
              >
                <Grid3x3 className="w-6 h-6" />
              </motion.button>

              {/* 스피커 */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleSpeaker}
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center ${
                  isSpeakerOn ? 'bg-white text-gray-900' : 'bg-gray-700 text-white'
                }`}
              >
                {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </motion.button>

              {/* 추가 */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 rounded-full bg-gray-700 text-white flex flex-col items-center justify-center opacity-50"
                disabled
              >
                <UserPlus className="w-6 h-6" />
              </motion.button>

              {/* 전화 아이콘 (비활성) */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 rounded-full bg-gray-700 text-white flex flex-col items-center justify-center opacity-50"
                disabled
              >
                <Phone className="w-6 h-6" />
              </motion.button>

              {/* 더보기 */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 rounded-full bg-gray-700 text-white flex flex-col items-center justify-center opacity-50"
                disabled
              >
                <MoreVertical className="w-6 h-6" />
              </motion.button>
            </div>

            {/* 라벨 */}
            <div className="grid grid-cols-3 gap-6 mb-8 text-center text-xs text-gray-400">
              <span>{isMuted ? "음소거 켜짐" : "음소거"}</span>
              <span>키패드</span>
              <span>{isSpeakerOn ? "스피커 켜짐" : "스피커"}</span>
              <span>추가</span>
              <span>전화</span>
              <span>더보기</span>
            </div>

            {/* 통화 종료 버튼 */}
            <div className="flex justify-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={endConversation}
                className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}