from flask import Flask, request, jsonify, render_template
from markitdown import MarkItDown
from werkzeug.utils import secure_filename
import os
import tempfile

app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = os.environ.get("MAX_FILE_SIZE", 15 * 1024 * 1024)    # 此处是默认为15MB
# 支持的文件扩展名
ALLOWED_EXTENSIONS = {
    'pdf', 'pptx', 'docx', 'xlsx', 'csv', 'json', 'xml', 'html', 'htm'
}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/convert', methods=['POST'])
def convert_files():
    if 'files' not in request.files:
        return jsonify({'error': '请求中没有文件部分'}), 400

    files = request.files.getlist('files')
    if not files:
        return jsonify({'error': '没有选择要上传的文件'}), 400

    markitdown = MarkItDown()
    results = []

    for file in files:
        if file and allowed_file(file.filename):
            original_filename = file.filename  # 保留原始文件名
            filename = secure_filename(original_filename)
            try:
                # 使用临时文件保存上传的文件
                with tempfile.NamedTemporaryFile(delete=False) as tmp:
                    file.save(tmp.name)
                    temp_path = tmp.name

                # 使用 MarkItDown 进行转换
                conversion = markitdown.convert(temp_path)
                markdown_content = conversion.text_content

                # 删除临时文件
                os.remove(temp_path)

                results.append({
                    'original_filename': original_filename,  # 使用原始文件名
                    'markdown_content': markdown_content
                })
            except Exception as e:
                results.append({
                    'original_filename': original_filename,
                    'error': str(e)
                })
        else:
            results.append({
                'original_filename': file.filename,
                'error': '不支持的文件类型'
            })

    return jsonify({'results': results}), 200

if __name__ == '__main__':
    app.run(debug=True)
