import React, { useState } from 'react';

interface TutorialProps {
    onComplete: () => void;
}

const TUTORIAL_SLIDES = [
    {
        icon: '👋',
        title: 'Bye Mistakesへようこそ！',
        description: 'あなたの情報を基に、学習体験をパーソナライズします。'
    },
    {
        icon: '🌱',
        title: '復習タブ: ミスを"学びの種"に',
        description: '間違えた問題と原因を登録すると、AIがあなた専用の克服ドリルを5問作成します。'
    },
    {
        icon: '💖',
        title: 'AIによる採点 & フィードバック',
        description: 'ドリルを解くとAIが採点。あなたの性格に合わせた、心に響く励ましのフィードバックを提供します。'
    },
    {
        icon: '🧭',
        title: '演習タブ: 弱点を徹底分析',
        description: 'これまでのミス傾向をAIが分析し根本的な弱点を特定。トレーニングモードで反復練習もできます。'
    },
    {
        icon: '🚀',
        title: 'さあ、始めましょう！',
        description: '準備は完了です！下のボタンを押して、AIの初期設定を行いましょう。'
    }
];

const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < TUTORIAL_SLIDES.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onComplete();
        }
    };

    const slide = TUTORIAL_SLIDES[currentSlide];

    return (
        <div 
            className="fixed inset-0 bg-cover bg-center flex items-center justify-center z-50 p-4"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop')" }}
        >
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-md p-8 text-center transform transition-all duration-300 ease-in-out scale-100 border border-purple-400/50">
                <div className="text-6xl mb-4 animate-bounce">{slide.icon}</div>
                <h2 className="text-2xl font-bold text-white mb-2">{slide.title}</h2>
                <p className="text-gray-300 mb-8 h-12">{slide.description}</p>

                <div className="flex justify-center space-x-2 mb-8">
                    {TUTORIAL_SLIDES.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === currentSlide ? 'bg-purple-400 scale-125' : 'bg-gray-500'
                            }`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="w-full bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg py-3 font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
                >
                    {currentSlide < TUTORIAL_SLIDES.length - 1 ? '次へ' : '完了'}
                </button>
            </div>
        </div>
    );
};

export default Tutorial;