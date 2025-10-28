import React from 'react';
import { TabName } from '../MainApp';

interface TabsProps {
  activeTab: string;
  setActiveTab: (tab: TabName) => void;
}

const TABS = [
    { id: 'review', label: '復習' },
    { id: 'practice', label: '演習' },
    { id: 'motivation', label: 'モチベーション' },
    { id: 'settings', label: '設定' }
];

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="bg-white border-b border-gray-200 sticky top-[77px] z-10">
            <nav className="flex justify-around -mb-px container mx-auto" aria-label="Tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabName)}
                        className={`${
                            activeTab === tab.id
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm sm:text-base transition-colors duration-200 focus:outline-none`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default Tabs;