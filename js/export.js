// エクスポート機能
class SpecExporter {
    constructor(app) {
        this.app = app;
        this.setupExportListeners();
    }

    setupExportListeners() {
        document.getElementById('exportMarkdownBtn').addEventListener('click', () => {
            this.exportMarkdown();
        });

        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportPDF();
        });

        document.getElementById('exportWordBtn').addEventListener('click', () => {
            this.exportWord();
        });
    }

    // Markdownエクスポート
    exportMarkdown() {
        const data = this.app.getFormData();
        const markdown = this.generateMarkdown(data);

        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const filename = `仕様書_${data.subject || '無題'}_v${this.app.version}.md`;
        this.downloadFile(blob, filename);
    }

    generateMarkdown(data) {
        let md = `# ${data.subject || '（件名未入力）'}\n\n`;
        md += `**バージョン:** ${this.app.version}  \n`;
        md += `**作成日:** ${this.app.formatDate(this.app.createdDate)}\n\n`;
        md += `---\n\n`;

        md += `## 基本情報\n\n`;
        md += `### 調達の背景\n\n${data.background || '（未入力）'}\n\n`;
        md += `### 調達の目的\n\n${data.purpose || '（未入力）'}\n\n`;
        md += `### 納品物\n\n${data.deliverables || '（未入力）'}\n\n`;
        md += `### 納品場所\n\n${data.deliveryLocation || '（未入力）'}\n\n`;
        md += `### 納品期限\n\n${this.formatDeadline(data.deliveryDeadline)}\n\n`;

        md += `---\n\n`;
        md += `## 調達情報\n\n`;
        md += `### 調達の種別\n\n${data.procurementType || '（未選択）'}\n\n`;
        md += `### 調達のスコープ\n\n`;
        if (data.procurementScope && data.procurementScope.length > 0) {
            data.procurementScope.forEach(scope => {
                md += `- ${scope}\n`;
            });
            md += `\n`;
        } else {
            md += `（未選択）\n\n`;
        }

        md += `### 受注者に求められる要件\n\n${data.contractorRequirements || '（未入力）'}\n\n`;
        md += `### 業務の基本要件\n\n${data.basicRequirements || '（未入力）'}\n\n`;

        md += `---\n\n`;
        md += `## 各業務の詳細仕様\n\n`;

        if (data.tasks && data.tasks.length > 0) {
            data.tasks.forEach((task, index) => {
                md += `### ${index + 1}. ${task.title || '（タイトル未入力）'}\n\n`;
                md += `${task.details || '（詳細未入力）'}\n\n`;
            });
        } else {
            md += `（業務が登録されていません）\n\n`;
        }

        return md;
    }

    // PDFエクスポート
    async exportPDF() {
        const data = this.app.getFormData();

        // jsPDFライブラリが読み込まれているか確認
        if (typeof window.jspdf === 'undefined') {
            alert('PDFライブラリの読み込みに失敗しました。ページを再読み込みしてください。');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // 日本語フォントの設定（簡易的な対応）
        let yPosition = 20;
        const lineHeight = 7;
        const marginLeft = 20;
        const pageWidth = 170;

        // タイトル
        doc.setFontSize(18);
        const title = data.subject || '（件名未入力）';
        doc.text(this.toAscii(title), marginLeft, yPosition);
        yPosition += lineHeight * 2;

        // バージョンと作成日
        doc.setFontSize(10);
        doc.text(`Version: ${this.app.version}`, marginLeft, yPosition);
        yPosition += lineHeight;
        doc.text(`Created: ${this.app.formatDate(this.app.createdDate)}`, marginLeft, yPosition);
        yPosition += lineHeight * 2;

        // セクション追加のヘルパー関数
        const addSection = (title, content) => {
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(12);
            doc.text(this.toAscii(title), marginLeft, yPosition);
            yPosition += lineHeight;

            doc.setFontSize(10);
            const lines = doc.splitTextToSize(this.toAscii(content || '（未入力）'), pageWidth);
            lines.forEach(line => {
                if (yPosition > 280) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(line, marginLeft, yPosition);
                yPosition += lineHeight;
            });
            yPosition += lineHeight * 0.5;
        };

        // 基本情報
        addSection('■ 調達の背景', data.background);
        addSection('■ 調達の目的', data.purpose);
        addSection('■ 納品物', data.deliverables);
        addSection('■ 納品場所', data.deliveryLocation);
        addSection('■ 納品期限', this.formatDeadline(data.deliveryDeadline));

        // 調達情報
        addSection('■ 調達の種別', data.procurementType);
        addSection('■ 調達のスコープ', data.procurementScope ? data.procurementScope.join(', ') : '');
        addSection('■ 受注者に求められる要件', data.contractorRequirements);
        addSection('■ 業務の基本要件', data.basicRequirements);

        // 各業務の詳細
        if (data.tasks && data.tasks.length > 0) {
            data.tasks.forEach((task, index) => {
                addSection(`■ 業務 ${index + 1}: ${task.title}`, task.details);
            });
        }

        // PDFを保存
        const filename = `spec_${data.subject || 'untitled'}_v${this.app.version}.pdf`;
        doc.save(filename);
    }

    // Wordエクスポート
    async exportWord() {
        const data = this.app.getFormData();

        // docxライブラリが読み込まれているか確認
        if (typeof docx === 'undefined') {
            alert('Wordライブラリの読み込みに失敗しました。ページを再読み込みしてください。');
            return;
        }

        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

        const children = [];

        // タイトル
        children.push(
            new Paragraph({
                text: data.subject || '（件名未入力）',
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
            })
        );

        // バージョンと作成日
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `バージョン: ${this.app.version}`,
                    }),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: `作成日: ${this.app.formatDate(this.app.createdDate)}`,
                    }),
                ],
            }),
            new Paragraph({ text: '' }) // 空行
        );

        // セクション追加のヘルパー関数
        const addSection = (title, content) => {
            children.push(
                new Paragraph({
                    text: title,
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    text: content || '（未入力）',
                }),
                new Paragraph({ text: '' }) // 空行
            );
        };

        // 基本情報
        children.push(
            new Paragraph({
                text: '基本情報',
                heading: HeadingLevel.HEADING_1,
            })
        );

        addSection('調達の背景', data.background);
        addSection('調達の目的', data.purpose);
        addSection('納品物', data.deliverables);
        addSection('納品場所', data.deliveryLocation);
        addSection('納品期限', this.formatDeadline(data.deliveryDeadline));

        // 調達情報
        children.push(
            new Paragraph({
                text: '調達情報',
                heading: HeadingLevel.HEADING_1,
            })
        );

        addSection('調達の種別', data.procurementType);

        children.push(
            new Paragraph({
                text: '調達のスコープ',
                heading: HeadingLevel.HEADING_2,
            })
        );

        if (data.procurementScope && data.procurementScope.length > 0) {
            data.procurementScope.forEach(scope => {
                children.push(
                    new Paragraph({
                        text: `• ${scope}`,
                        bullet: { level: 0 }
                    })
                );
            });
            children.push(new Paragraph({ text: '' }));
        } else {
            children.push(
                new Paragraph({ text: '（未選択）' }),
                new Paragraph({ text: '' })
            );
        }

        addSection('受注者に求められる要件', data.contractorRequirements);
        addSection('業務の基本要件', data.basicRequirements);

        // 各業務の詳細
        children.push(
            new Paragraph({
                text: '各業務の詳細仕様',
                heading: HeadingLevel.HEADING_1,
            })
        );

        if (data.tasks && data.tasks.length > 0) {
            data.tasks.forEach((task, index) => {
                addSection(`業務 ${index + 1}: ${task.title || '（タイトル未入力）'}`, task.details);
            });
        } else {
            children.push(new Paragraph({ text: '（業務が登録されていません）' }));
        }

        // ドキュメントを作成
        const doc = new Document({
            sections: [{
                properties: {},
                children: children,
            }],
        });

        // Wordファイルを生成してダウンロード
        try {
            const blob = await Packer.toBlob(doc);
            const filename = `仕様書_${data.subject || '無題'}_v${this.app.version}.docx`;
            this.downloadFile(blob, filename);
        } catch (error) {
            console.error('Word export error:', error);
            alert('Word形式でのエクスポート中にエラーが発生しました。');
        }
    }

    // ヘルパー関数
    formatDeadline(dateString) {
        if (!dateString) return '（未入力）';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
    }

    // ASCII変換（PDF用の簡易対応）
    toAscii(text) {
        // 日本語文字をできるだけ保持しつつ、基本的な変換を行う
        return text;
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// エクスポート機能の初期化
document.addEventListener('DOMContentLoaded', () => {
    // appが初期化されるまで少し待つ
    setTimeout(() => {
        if (typeof app !== 'undefined') {
            new SpecExporter(app);
        }
    }, 100);
});
