const checkBtn = document.getElementById('check-update');
const updateStatus = document.getElementById('update-status');
const statusText = updateStatus.querySelector('.status-text');

export function initUpdate() {
    checkBtn.addEventListener('click', () => {
        // Устанавливаем состояние загрузки
        checkBtn.classList.add('loading');
        updateStatus.className = 'status-container checking';
        statusText.textContent = 'Проверяем обновления...';

        window.electronAPI.checkForUpdates();
    });

    window.electronAPI.onUpdateInfo((info) => {
        if (info.version === null) {
            updateStatus.className = 'status-container up-to-date';
            statusText.textContent = '✅ Обновлений нет. Вы используете последнюю версию.';
        } else {
            updateStatus.className = 'status-container available';
            statusText.textContent = `Доступно обновление до версии ${info.version}, размер: ${info.size} MB. Скачивается...`;
        }
        checkBtn.classList.remove('loading');
    });

    window.electronAPI.onUpdateError((err) => {
        updateStatus.className = 'status-container error';
        statusText.textContent = `❌ Ошибка проверки обновлений: ${err}`;
        checkBtn.classList.remove('loading');
    });

}