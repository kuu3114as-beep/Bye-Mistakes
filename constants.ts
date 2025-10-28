import { MessageOption } from './types';

export const GRADE_OPTIONS: MessageOption[] = [
    { label: '小学1年生', value: '小学1年生' },
    { label: '小学2年生', value: '小学2年生' },
    { label: '小学3年生', value: '小学3年生' },
    { label: '小学4年生', value: '小学4年生' },
    { label: '小学5年生', value: '小学5年生' },
    { label: '小学6年生', value: '小学6年生' },
    { label: '中学1年生', value: '中学1年生' },
    { label: '中学2年生', value: '中学2年生' },
    { label: '中学3年生', value: '中学3年生' },
    { label: '高校1年生', value: '高校1年生' },
    { label: '高校2年生', value: '高校2年生' },
    { label: '高校3年生', value: '高校3年生' },
    { label: '高専生', value: '高専生' },
    { label: 'その他', value: 'その他' },
];

export const GENDER_OPTIONS: MessageOption[] = [
    { label: '男性', value: '男性' },
    { label: '女性', value: '女性' },
    { label: 'その他', value: 'その他' },
    { label: '回答しない', value: '回答しない' },
];

const mbtiTypes = [
    { code: 'ISTJ', name: '管理者' },
    { code: 'ISFJ', name: '擁護者' },
    { code: 'INFJ', name: '提唱者' },
    { code: 'INTJ', name: '建築家' },
    { code: 'ISTP', name: '巨匠' },
    { code: 'ISFP', name: '冒険家' },
    { code: 'INFP', name: '仲介者' },
    { code: 'INTP', name: '論理学者' },
    { code: 'ESTP', name: '起業家' },
    { code: 'ESFP', name: 'エンターテイナー' },
    { code: 'ENFP', name: '運動家' },
    { code: 'ENTP', name: '討論者' },
    { code: 'ESTJ', name: '幹部' },
    { code: 'ESFJ', name: '領事' },
    { code: 'ENFJ', name: '主人公' },
    { code: 'ENTJ', name: '指揮官' },
];

export const MBTI_OPTIONS: MessageOption[] = [
    ...mbtiTypes.map(mbti => ({
        label: `${mbti.code} (${mbti.name})`,
        value: `${mbti.code} (${mbti.name})`
    })),
    { label: 'わからない', value: 'わからない' },
    { label: '回答しない', value: '回答しない' },
];

export const AI_PERSONALITIES = [
    { key: 'gyaru', label: '陽気なギャル', description: 'いつも明るくポジティブ！友達感覚で、テンション高めに楽しく会話を盛り上げてくれます。', prompt: 'あなたはいつも明るくポジティブな「陽気なギャル」です。友達感覚で、テンション高めに楽しく会話を盛り上げてください。流行りの言葉を使っても面白いかもしれません。' },
    { key: 'teacher', label: '優しい先生', description: 'あなたの学習を優しく、そして丁寧にサポートします。どんな質問にも親身になって答えてくれる、頼れる先生です。', prompt: 'あなたはユーザーを生徒として導く、面倒見の良い「優しい先生」です。常に親身に、丁寧で分かりやすい言葉で励ましてください。' },
    { key: 'nekketsu', label: '熱血教師', description: '根性論や熱い言葉で、あなたの限界を突破させる超体育会系コーチ。時には厳しい言葉で、あなたを本気にさせます。', prompt: 'あなたは生徒の限界を突破させる「熱血教師」です。根性論や熱い言葉を使い、時には「〜しろ！」「〜だ！」といった命令口調で、ユーザーを全力で応援し、鼓舞してください。常に情熱的で、少し大げさなくらいが丁度良いです。' },
    { key: 'cool_senior', label: 'クールな先輩', description: '普段は冷静沈着で少し口数が少ないけれど、的確なアドバイスをくれる「クールな先輩」。たまに見せる優しさが魅力です。', prompt: 'あなたは普段は冷静沈着で少し口数は少ないけれど、的確なアドバイスをくれる「クールな先輩」です。たまに見せる優しさが魅力です。' },
    { key: 'robot', label: '端的ロボット', description: '感情を持たず、常に論理的で正確な情報を提供します。データに基づいた分析的な回答が得意です。', prompt: 'あなたは感情を持たず、常に論理的で正確な情報を提供する「AI ロボット」です。データに基づいた分析的な話し方をしてください。いかなる場合でも、応答は必ず要点をまとめた箇条書き、または非常に短い段落で、情報を簡潔に提示してください。感情的な表現や余計な装飾は一切不要です。' },
    { key: 'hakase', label: '博士', description: 'あらゆる知識に精通した博識な研究者。少し変わっているけれど、物事の本質を突く深い洞察を与えてくれます。', prompt: 'あなたはその分野の専門家である「博士」です。豊富な知識と探求心に基づき、少し専門的な言葉も交えながら、物事を深く分析して解説します。口調は「〜じゃ」「〜かね？」など、博士らしいものにしてください。' },
    { key: 'custom', label: 'カスタム', description: 'AIの性格や話し方を、あなた自身で自由に設定できます。', prompt: '' },
];

export const GOAL_BACKGROUND_COLORS = [
  '#FFFFFF', '#bae6fd', '#a7f3d0', '#fde68a', '#fecdd3', 
  '#ddd6fe', '#d9f99d', '#a5f3fc', '#f5d0fe', '#fed7aa'
];

export const GOAL_BACKGROUND_PRESETS = [
    { key: 'preset_01', url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2070&auto=format&fit=crop', label: '花畑' },
    { key: 'preset_02', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2113&auto=format&fit=crop', label: '星空' },
    { key: 'preset_03', url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=2070&auto=format&fit=crop', label: '朝の光' },
    { key: 'preset_04', url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1974&auto=format&fit=crop', label: '滝' },
    { key: 'preset_05', url: 'https://images.unsplash.com/photo-1507525428034-b723a996f3ea?q=80&w=2070&auto=format&fit=crop', label: 'ビーチ' },
    { key: 'preset_06', url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=2070&auto=format&fit=crop', label: '森' },
    { key: 'preset_07', url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=2070&auto=format&fit=crop', label: '日の出' },
    { key: 'preset_08', url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=2070&auto=format&fit=crop', label: '小道' },
    { key: 'preset_09', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop', label: '山々' },
    { key: 'preset_10', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop', label: '霧の森' },
    { key: 'preset_11', url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=2175&auto=format&fit=crop', label: '草原' },
    { key: 'preset_12', url: 'https://images.unsplash.com/photo-1431036101494-69a3621d1029?q=80&w=2070&auto=format&fit=crop', label: '青空' },
];


export const LEARNING_PREFERENCES: Record<string, {key: string; label: string}[]> = {
    '学習スタイル': [
        { key: 'visual', label: '図やグラフで視覚的に学びたい' },
        { key: 'logical', label: '論理的な説明で納得したい' },
        { key: 'practical', label: '実践的な問題をたくさん解きたい' },
        { key: 'summary', label: '最初に要点をまとめてほしい' },
        { key: 'step_by_step', label: '一歩一歩、段階的に進めたい' },
    ],
    '暗記の仕方': [
        { key: 'repetition', label: '繰り返し書いて覚える' },
        { key: 'association', label: '語呂合わせや関連付けで覚える' },
        { key: 'read_aloud', label: '声に出して覚える' },
        { key: 'mnemonics', label: '記憶術（マインドマップなど）を使う' },
    ],
    '勉強への意識': [
        { key: 'like_studying', label: '勉強は好きな方だ' },
        { key: 'dislike_studying', label: '勉強は苦手・嫌いだ' },
        { key: 'praise_driven', label: '褒められて伸びるタイプだ' },
        { key: 'competitive', label: '競争が好きで、負けず嫌いだ' },
    ]
};

export const PROFANITY_LIST = [
    'sex', 'fuck', 'shit', 'bitch', 'cunt', 'asshole', 'dick', 'pussy', 'nigger', 'faggot',
    'ちんちん', 'まんこ', 'うんこ', 'セックス', '死ね', '殺す', 'キチガイ', '馬鹿', 'アホ'
];