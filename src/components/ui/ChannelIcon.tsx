import { MessageSquare, Phone, Mail, Cpu } from 'lucide-react';

const icons = {
  SMS: MessageSquare,
  Voice: Phone,
  Email: Mail,
  System: Cpu,
};

export default function ChannelIcon({ channel, className = 'w-4 h-4' }: { channel: string; className?: string }) {
  const Icon = icons[channel as keyof typeof icons] || Cpu;
  return <Icon className={`${className} text-neon`} />;
}
