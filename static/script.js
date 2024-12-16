document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('file-input');
    const resultsTableBody = document.querySelector('#results-table tbody');
    const clearCacheButton = document.getElementById('clear-cache');
    const modal = document.getElementById('content-modal');
    const modalContent = document.getElementById('markdown-content');
    const closeButton = document.querySelector('.close-button');

    // 加载本地存储的记录
    loadRecordsFromStorage();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const files = fileInput.files;
        if (files.length === 0) {
            alert('请至少选择一个文件进行上传。');
            return;
        }

        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }

        fetch('/api/convert', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.results) {
                data.results.forEach(result => {
                    if (!result.error) {
                        addRecordToTable(result);
                        saveRecordToStorage(result);
                    } else {
                        alert(`文件 ${result.original_filename} 转换失败: ${result.error}`);
                    }
                });
                // 清空文件输入
                fileInput.value = '';
            } else if (data.error) {
                alert(`错误: ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('发生错误，请重试。');
        });
    });

    clearCacheButton.addEventListener('click', () => {
        if (confirm('确定要清理所有转换记录吗？')) {
            localStorage.removeItem('conversionRecords');
            resultsTableBody.innerHTML = '';
        }
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    function addRecordToTable(record) {
        const tr = document.createElement('tr');

        // 原文件名
        const tdOriginal = document.createElement('td');
        tdOriginal.textContent = record.original_filename;
        tr.appendChild(tdOriginal);

        // 下载按钮
        const tdDownload = document.createElement('td');
        const downloadButton = document.createElement('a');
        downloadButton.href = createDownloadLink(record.markdown_content, getMarkdownFilename(record.original_filename));
        downloadButton.textContent = '下载';
        downloadButton.classList.add('download-link');
        downloadButton.download = getMarkdownFilename(record.original_filename);
        tdDownload.appendChild(downloadButton);
        tr.appendChild(tdDownload);

        // 显示内容按钮
        const tdDisplay = document.createElement('td');
        const displayButton = document.createElement('button');
        displayButton.textContent = '显示内容';
        displayButton.classList.add('display-content');
        displayButton.addEventListener('click', () => {
            displayContent(record.markdown_content);
        });
        tdDisplay.appendChild(displayButton);
        tr.appendChild(tdDisplay);

        resultsTableBody.appendChild(tr);
    }

    function saveRecordToStorage(record) {
        let records = JSON.parse(localStorage.getItem('conversionRecords')) || [];
        records.push(record);
        localStorage.setItem('conversionRecords', JSON.stringify(records));
    }

    function loadRecordsFromStorage() {
        let records = JSON.parse(localStorage.getItem('conversionRecords')) || [];
        records.forEach(record => {
            addRecordToTable(record);
        });
    }

    function createDownloadLink(content, filename) {
        const blob = new Blob([content], { type: 'text/markdown' });
        return URL.createObjectURL(blob);
    }

    function getMarkdownFilename(originalFilename) {
        const baseName = originalFilename.replace(/\.[^/.]+$/, "");
        return `${baseName}.md`;
    }

    function displayContent(content) {
        modalContent.textContent = content;
        modal.style.display = 'block';
    }
});
