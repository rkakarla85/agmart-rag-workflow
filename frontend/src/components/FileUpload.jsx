import React, { useState } from 'react';

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setMessage(`Success: ${data.message} (${data.chunks_added} chunks)`);
            } else {
                setMessage('Upload failed.');
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4">Upload Data</h2>
            <div className="flex items-center gap-4">
                <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100
          "
                />
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {uploading ? 'Uploading...' : 'Upload'}
                </button>
            </div>
            {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
        </div>
    );
};

export default FileUpload;
