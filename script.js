// GitHub設定 (任意)
const GH_CONFIG = { owner: "souta-624", repo: "school", path: "data.json" };

class App {
    constructor() {
        this.adminData = {
            timeSettings: [
                { p: 1, s: "08:50", e: "09:40" },
                { p: 2, s: "09:50", e: "10:40" },
                { p: 3, s: "10:50", e: "11:40" },
                { p: 4, s: "11:50", e: "12:40" },
                { p: 5, s: "13:30", e: "14:20" },
                { p: 6, s: "14:30", e: "15:20" }
            ],
            schedule: {},
            tests: []
        };
        this.userData = JSON.parse(localStorage.getItem('school_user_settings')) || { classId: '21HR' };
        this.editingClass = '21HR';
    }

    async init() {
        await this.loadFromGitHub();
        this.setupEvents();
        this.startClock();
        this.renderDashboard();
    }

    // 管理者：共通授業時間の設定画面を生成
    renderTimeSettingsEditor() {
        const container = document.getElementById('adminTimeSettingsEditor');
        container.innerHTML = '';
        this.adminData.timeSettings.forEach((t, i) => {
            const div = document.createElement('div');
            div.className = 'time-row';
            div.innerHTML = `
                <span>${t.p}限目:</span>
                <input type="time" value="${t.s}" data-idx="${i}" data-type="s">
                <span>～</span>
                <input type="time" value="${t.e}" data-idx="${i}" data-type="e">
            `;
            container.appendChild(div);
        });
    }

    // 時間設定をメモリに保存
    saveTimeInputs() {
        const inputs = document.querySelectorAll('#adminTimeSettingsEditor input');
        inputs.forEach(input => {
            const idx = input.dataset.idx;
            const type = input.dataset.type;
            this.adminData.timeSettings[idx][type] = input.value;
        });
    }

    // 次の授業判定ロジック (保存された時間設定を使用)
    updateNextClass(todaySubs) {
        const el = document.getElementById('nextClassDisplay');
        if (!todaySubs || todaySubs.length === 0) { el.textContent = "休日です"; return; }

        const now = new Date();
        const nowM = now.getHours() * 60 + now.getMinutes();
        let found = false;

        for (let t of this.adminData.timeSettings) {
            const [sH, sM] = t.s.split(':').map(Number);
            const [eH, eM] = t.e.split(':').map(Number);
            const startM = sH * 60 + sM;
            const endM = eH * 60 + eM;

            if (nowM >= startM && nowM <= endM) {
                el.innerHTML = `<span style="color:var(--primary); font-weight:bold;">${todaySubs[t.p-1] || "空き"}</span><br><small>${t.p}限目 (あと${endM - nowM}分)</small>`;
                found = true; break;
            }
            if (nowM < startM) {
                el.innerHTML = `<span style="font-weight:bold;">次は ${todaySubs[t.p-1] || "空き"}</span><br><small>${t.s}開始 (${t.p}限)</small>`;
                found = true; break;
            }
        }
        if (!found) el.textContent = "今日の授業は終了";
    }

    // イベント設定
    setupEvents() {
        // ログイン処理
        document.getElementById('adminLoginSubmit').onclick = () => {
            if(document.getElementById('adminPinInput').value === '1234') {
                this.renderTimeSettingsEditor(); // 時間設定エディタを表示
                this.renderAdminScheduleEditor();
                this.navigate('admin');
            } else { alert("パスワードが違います"); }
        };

        // 保存ボタン
        document.getElementById('saveAdminDataBtn').onclick = () => {
            this.saveTimeInputs(); // 時間設定を保存
            this.saveCurrentEditingClassSchedule(); // クラス別を保存
            this.saveToGitHub();
        };

        // その他（前回のコードと同様）
    }

    // --- その他描画系は前回の構成を継承 ---
    navigate(id) {
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${id}`).classList.add('active');
    }

    startClock() {
        setInterval(() => {
            const n = new Date();
            document.getElementById('clockTime').textContent = n.toLocaleTimeString('ja-JP');
            if(n.getSeconds() === 0) this.renderDashboard();
        }, 1000);
    }

    renderDashboard() {
        document.getElementById('displayClassName').textContent = this.userData.classId;
        const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const todayKey = dayMap[new Date().getDay()];
        const classSch = this.adminData.schedule[this.userData.classId] || {};
        const todaySubs = classSch[todayKey] || [];
        this.updateNextClass(todaySubs);
        // ...時間割リスト描画...
    }
}

const app = new App();
window.onload = () => app.init();
