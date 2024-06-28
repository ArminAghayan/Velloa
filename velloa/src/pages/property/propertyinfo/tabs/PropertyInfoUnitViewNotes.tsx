import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message, Typography, Input } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import { nanoid } from 'nanoid';

const { Title } = Typography;

interface PropertyData {
  id: string;
  units: any[];
}

interface Props {
  propertyId: string;
  unitName: string;
  onSave: () => void;
}

const PropertyInfoUnitViewNotes: React.FC<Props> = ({ propertyId, unitName, onSave }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [unit, setUnit] = useState<any>(null);
  const [noteName, setNoteName] = useState('');

  const editor = useEditor({
    extensions: [StarterKit, Bold, Italic, Underline, BulletList, ListItem],
    content: '',
  });

  useEffect(() => {
    const fetchPropertyAndUnit = async () => {
      const db = getFirestore();
      const propertyRef = doc(db, 'properties', propertyId);

      try {
        const propertySnap = await getDoc(propertyRef);
        if (propertySnap.exists()) {
          const propertyData = { id: propertySnap.id, ...propertySnap.data() } as PropertyData;
          setProperty(propertyData);

          const unitData = propertyData.units.find((u: any) => u.unitName === unitName);
          if (unitData) {
            setUnit(unitData);
          } else {
            message.error('Unit not found');
            navigate(-1);
          }
        } else {
          message.error('Property not found');
          navigate(-1);
        }
      } catch (error) {
        message.error('Failed to fetch data');
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPropertyAndUnit();
  }, [propertyId, unitName, navigate]);

  const handleNoteSave = async () => {
    const noteContent = editor?.getHTML();
    const noteDate = new Date().toISOString();

    if (!noteContent || !noteName) {
      message.error('Cannot save note: Missing content or note name');
      return;
    }

    if (!property || !unit) {
      message.error('Missing required data');
      return;
    }

    const storage = getStorage();
    const noteRef = ref(storage, `properties/${propertyId}/units/${unitName}/notes/${nanoid()}.html`);

    try {
      await uploadString(noteRef, noteContent);

      const db = getFirestore();
      const propertyRef = doc(db, 'properties', propertyId);
      const propertySnap = await getDoc(propertyRef);

      if (propertySnap.exists()) {
        const propertyData = propertySnap.data() as PropertyData;
        const updatedUnits = propertyData.units.map((u: any) =>
          u.unitName === unitName
            ? { ...u, notes: [...(u.notes || []), { name: noteName, date: noteDate, ref: noteRef.fullPath }] }
            : u
        );

        await updateDoc(propertyRef, { units: updatedUnits });
        message.success('Note saved successfully');
        onSave(); // Call the onSave callback to close the modal
      } else {
        message.error('Property not found');
      }
    } catch (error) {
      message.error('Failed to save note');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Input
        placeholder="Enter note name"
        value={noteName}
        onChange={(e) => setNoteName(e.target.value)}
        style={{ marginBottom: '16px' }}
      />
      <div style={{ border: '1px solid #ccc', padding: '8px', marginBottom: '16px' }}>
        <EditorContent editor={editor} />
      </div>
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={handleNoteSave}
        style={{ marginTop: '16px' }}
      >
        Save Note
      </Button>
    </div>
  );
};

export default PropertyInfoUnitViewNotes;
