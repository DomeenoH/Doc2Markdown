from flask import Flask, request, render_template, jsonify
from markitdown import MarkItDown
import os
import tempfile

app = Flask(__name__)

ALLOWED_EXTENSIONS = {'docx', 'txt', 'md'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    # 前端上传页面
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert_file():
    # 文件上传与转换
    if 'file' not in request.files:
        return "未找到文件", 400
    
    file = request.files['file']
    if file and allowed_file(file.filename):
        original_filename = file.filename
        try:
            # 临时保存文件
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                file.save(temp_file.name)
                temp_path = temp_file.name
            
            # 使用 MarkItDown 转换文件
            markdown_content = MarkItDown().convert(temp_path)
            os.remove(temp_path)  # 删除临时文件
            
            # 渲染结果页面
            return render_template('result.html', 
                                   filename=original_filename, 
                                   markdown_content=markdown_content)
        except Exception as e:
            return f"处理文件时出错: {str(e)}", 500
    
    return "文件类型不被支持", 400

if __name__ == '__main__':
    app.run(debug=True)
