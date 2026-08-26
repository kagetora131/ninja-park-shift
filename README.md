# 忍者パークシフト (Ninja Park Shift)

忍者テーマパーク（忍具屋・修行アトラクション・忍者茶屋）向けの、シフト作成が楽しくなるゲーミフィケーション型シフト管理アプリ。

従業員ごとの忍者アバターが、シフトの組まれ方（希望通りか／連勤日数／不慣れな施設への応援かどうか）に応じて
`happy` → `neutral` → `tired` → `unhappy` と表情を変える。マネージャーは各従業員の顔を見るだけで
無理なシフトになっていないかを直感的に把握できる。施設別・日別の売上と人件費も連動して可視化する。

詳しい企画背景は [CLAUDE.md](./CLAUDE.md) を参照。

## 主な機能

- **忍者名簿**: 日付を選ぶと、その日の施設別配置を忍者アバター付きで一覧表示。表情の理由もその場で表示。
- **シフト表**: 14日分 × 3施設のシフトを一覧・追加・編集・削除できる簡易シフト編成画面。
- **収支**: 期間合計の売上・人件費・損益、日別の損益グラフ、赤字連続日数のアラート表示。

## 技術構成（完全無料・オープンソースのみ）

- [React](https://react.dev/) + TypeScript + [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [DiceBear](https://www.dicebear.com/)（忍者アバターのベース生成、MITライセンス）
- [Lucide](https://lucide.dev/)（アイコン、MITライセンス）
- データ永続化はブラウザの `localStorage` のみ（バックエンド・課金APIなし）

## 開発

```bash
npm install
npm run dev
```

`ninja_park_shift_dummy_data_updated.json` が初期データ。シフト表で編集した内容はブラウザの
localStorage に保存され、ヘッダーの「初期状態に戻す」でいつでもダミーデータへリセットできる。

```bash
npm run build   # 型チェック + 本番ビルド
npm run lint    # oxlint
```
