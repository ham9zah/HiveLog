import { MessageSquare, Zap, BookOpen } from 'lucide-react';

const StageBadge = ({ stage }) => {
  const stages = {
    sandbox: {
      label: 'نقاش نشط',
      icon: MessageSquare,
      className: 'stage-badge stage-sandbox',
    },
    processing: {
      label: 'جاري المعالجة',
      icon: Zap,
      className: 'stage-badge stage-processing animate-pulse',
    },
    wiki: {
      label: 'ويكي متجدد',
      icon: BookOpen,
      className: 'stage-badge stage-wiki',
    },
  };

  const config = stages[stage] || stages.sandbox;
  const Icon = config.icon;

  return (
    <span className={config.className}>
      <Icon size={14} />
      <span>{config.label}</span>
    </span>
  );
};

export default StageBadge;
