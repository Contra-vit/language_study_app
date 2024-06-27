import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { saveAs } from 'file-saver';

const LanguageStudyApp: React.FC = () => {
  const [excelData, setExcelData] = useState<{ russian: string, dutch: string }[]>([]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const formattedData = jsonData.map((row) => ({
          russian: row[0],
          dutch: row[1],
        }));
        setExcelData(formattedData);
      };
      reader.readAsBinaryString(file);
    }
  };

  // Generate and download audio file
  const generateAudioFile = async () => {
    const googleTranslateAPIKey = 'AIzaSyD2_YfO5n3hmVyIvvSncM06mHvoPYymd2I';

    const translations: { russianAudio: Blob, dutchAudio: Blob }[] = await Promise.all(
      excelData.map(async ({ russian, dutch }) => {
        const russianAudio = await generateAudio(russian, 'ru-RU', googleTranslateAPIKey);
        const dutchAudio = await generateAudio(dutch, 'nl-NL', googleTranslateAPIKey);
        return { russianAudio, dutchAudio };
      })
    );

    // Combine audio files
    const combinedAudio = new Blob(
      translations.flatMap(({ russianAudio, dutchAudio }) => [russianAudio, dutchAudio]),
      { type: 'audio/mp3' }
    );

    saveAs(combinedAudio, 'language_study_audio.mp3');
  };

  // Generate audio using Google Text-to-Speech API
  const generateAudio = async (text: string, languageCode: string, apiKey: string): Promise<Blob> => {
    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        input: { text },
        voice: { languageCode, ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      }
    );
    const audioContent = response.data.audioContent;
    const audioBlob = new Blob([Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))], { type: 'audio/mp3' });
    return audioBlob;
  };

  return (
    <div>
      <h1>Language Study App</h1>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      <button onClick={generateAudioFile}>Generate Audio</button>
    </div>
  );
};

export default LanguageStudyApp;