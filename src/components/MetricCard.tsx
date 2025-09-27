'use client';

import { ReactNode, useState } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Modal from './Modal';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  trend?: {
    value: number;
    label: string;
  };
  onClick?: () => void;
  modalContent?: ReactNode;
  modalTitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  trend,
  onClick,
  modalContent,
  modalTitle,
  size = 'md'
}: MetricCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (modalContent) {
      setIsModalOpen(true);
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    if (trend.value > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend.value < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    if (trend.value > 0) {
      return 'text-green-600';
    } else if (trend.value < 0) {
      return 'text-red-600';
    } else {
      return 'text-gray-600';
    }
  };

  const cardClasses = `
    bg-white rounded-lg shadow-md p-6 transition-all duration-200
    ${(onClick || modalContent) ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
  `;

  return (
    <>
      <div className={cardClasses} onClick={handleClick}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon className={`w-8 h-8 ${iconColor} mr-3`} />
            <div>
              <p className="text-sm text-gray-800">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          
          {trend && (
            <div className="flex items-center space-x-1">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        
        {trend && (
          <div className="mt-2">
            <p className="text-xs text-gray-600">{trend.label}</p>
          </div>
        )}
      </div>

      {modalContent && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalTitle || title}
          size={size}
        >
          {modalContent}
        </Modal>
      )}
    </>
  );
}