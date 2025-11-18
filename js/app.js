// アプリケーションの状態管理
class SpecApp {
    constructor() {
        this.version = this.loadVersion();
        this.createdDate = this.loadCreatedDate();
        this.formData = this.loadFormData();
        this.init();
    }

    init() {
        // 作成日とバージョンを表示
        this.updateVersionDisplay();
        this.updateDateDisplay();

        // イベントリスナーの設定
        this.setupEventListeners();

        // 保存されたフォームデータを復元
        this.restoreFormData();
    }

    // バージョン管理
    loadVersion() {
        const savedVersion = localStorage.getItem('specVersion');
        return savedVersion || '1.0.0';
    }

    saveVersion(version) {
        localStorage.setItem('specVersion', version);
        this.version = version;
    }

    updateVersion() {
        const parts = this.version.split('.');
        const major = parseInt(parts[0]);
        const minor = parseInt(parts[1]);
        const patch = parseInt(parts[2]);

        // パッチバージョンをインクリメント
        const newVersion = `${major}.${minor}.${patch + 1}`;
        this.saveVersion(newVersion);
        this.updateVersionDisplay();

        // バージョン更新時にフォームデータも保存
        this.saveFormData();

        alert(`バージョンを ${this.version} に更新しました`);
    }

    updateVersionDisplay() {
        document.getElementById('currentVersion').textContent = this.version;
    }

    // 作成日管理
    loadCreatedDate() {
        let savedDate = localStorage.getItem('specCreatedDate');
        if (!savedDate) {
            savedDate = new Date().toISOString().split('T')[0];
            localStorage.setItem('specCreatedDate', savedDate);
        }
        return savedDate;
    }

    updateDateDisplay() {
        const formattedDate = this.formatDate(this.createdDate);
        document.getElementById('createdDate').textContent = formattedDate;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}年${month}月${day}日`;
    }

    // フォームデータの保存と復元
    saveFormData() {
        const formData = this.collectFormData();
        localStorage.setItem('specFormData', JSON.stringify(formData));
    }

    loadFormData() {
        const savedData = localStorage.getItem('specFormData');
        return savedData ? JSON.parse(savedData) : null;
    }

    collectFormData() {
        const data = {
            subject: document.getElementById('subject').value,
            background: document.getElementById('background').value,
            purpose: document.getElementById('purpose').value,
            deliverables: document.getElementById('deliverables').value,
            deliveryLocation: document.getElementById('deliveryLocation').value,
            deliveryDeadline: document.getElementById('deliveryDeadline').value,
            procurementType: document.querySelector('input[name="procurementType"]:checked')?.value || '',
            procurementScope: Array.from(document.querySelectorAll('input[name="procurementScope"]:checked'))
                .map(cb => cb.value),
            contractorRequirements: document.getElementById('contractorRequirements').value,
            basicRequirements: document.getElementById('basicRequirements').value,
            tasks: []
        };

        // 各業務のタイトルと詳細を収集
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            const title = item.querySelector('.task-title').value;
            const details = item.querySelector('.task-details').value;
            data.tasks.push({ title, details });
        });

        return data;
    }

    restoreFormData() {
        if (!this.formData) return;

        const data = this.formData;

        document.getElementById('subject').value = data.subject || '';
        document.getElementById('background').value = data.background || '';
        document.getElementById('purpose').value = data.purpose || '';
        document.getElementById('deliverables').value = data.deliverables || '';
        document.getElementById('deliveryLocation').value = data.deliveryLocation || '';
        document.getElementById('deliveryDeadline').value = data.deliveryDeadline || '';

        // 調達の種別を復元
        if (data.procurementType) {
            const radio = document.querySelector(`input[name="procurementType"][value="${data.procurementType}"]`);
            if (radio) radio.checked = true;
        }

        // 調達のスコープを復元
        if (data.procurementScope) {
            data.procurementScope.forEach(value => {
                const checkbox = document.querySelector(`input[name="procurementScope"][value="${value}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        document.getElementById('contractorRequirements').value = data.contractorRequirements || '';
        document.getElementById('basicRequirements').value = data.basicRequirements || '';

        // タスクを復元
        if (data.tasks && data.tasks.length > 0) {
            const container = document.getElementById('tasksContainer');
            container.innerHTML = ''; // 既存のタスクをクリア

            data.tasks.forEach(task => {
                this.addTask(task.title, task.details);
            });
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // バージョン更新ボタン
        document.getElementById('updateVersionBtn').addEventListener('click', () => {
            this.updateVersion();
        });

        // 業務追加ボタン
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.addTask();
        });

        // フォーム変更時の自動保存
        const form = document.getElementById('specForm');
        form.addEventListener('change', () => {
            this.saveFormData();
        });

        // テキストエリアと入力フィールドの入力時も保存
        form.addEventListener('input', this.debounce(() => {
            this.saveFormData();
        }, 1000));
    }

    // 業務タスクの追加
    addTask(title = '', details = '') {
        const container = document.getElementById('tasksContainer');
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';

        taskItem.innerHTML = `
            <div class="form-group">
                <label>業務タイトル <span class="required">*</span></label>
                <input type="text" class="task-title" value="${title}" required>
            </div>
            <div class="form-group">
                <label>詳細仕様 <span class="required">*</span></label>
                <textarea class="task-details" rows="6" required>${details}</textarea>
            </div>
            <button type="button" class="btn btn-danger remove-task">この業務を削除</button>
        `;

        container.appendChild(taskItem);

        // 削除ボタンのイベントリスナー
        const removeBtn = taskItem.querySelector('.remove-task');
        removeBtn.addEventListener('click', () => {
            if (confirm('この業務を削除してもよろしいですか？')) {
                taskItem.remove();
                this.saveFormData();
            }
        });

        // 入力時の自動保存
        const inputs = taskItem.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', this.debounce(() => {
                this.saveFormData();
            }, 1000));
        });

        // 複数タスクがある場合のみ削除ボタンを表示
        this.updateRemoveButtons();
    }

    // 削除ボタンの表示/非表示を更新
    updateRemoveButtons() {
        const taskItems = document.querySelectorAll('.task-item');
        const removeButtons = document.querySelectorAll('.remove-task');

        removeButtons.forEach(btn => {
            btn.style.display = taskItems.length > 1 ? 'inline-block' : 'none';
        });
    }

    // デバウンス関数（頻繁な保存を防ぐ）
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // フォームデータを取得（エクスポート用）
    getFormData() {
        return this.collectFormData();
    }

    // データをリセット
    resetData() {
        if (confirm('全てのデータをリセットしてもよろしいですか？この操作は取り消せません。')) {
            localStorage.removeItem('specVersion');
            localStorage.removeItem('specCreatedDate');
            localStorage.removeItem('specFormData');
            location.reload();
        }
    }
}

// アプリケーションの初期化
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SpecApp();
});
