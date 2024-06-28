import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, message, Typography, Modal } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { nanoid } from 'nanoid';

const { Title } = Typography;

const PropertyInfoUnitViewNotes: React.FC = () => {
  const navigate = useNavigate();
  const { propertyId, unitName } = useParams<{ propertyId: string; unitName: string }>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  });

  const handleNoteSave = async () => {
    const noteContent = editor?.getHTML();
    if (!noteContent) {
      message.error('Cannot save note: Missing content');
      return;
    }

    const storage = getStorage();
    const noteRef = ref(storage, `notes/${propertyId}/${unitName}-${nanoid()}.html`);

    try {
      await uploadString(noteRef, noteContent);

      const db = getFirestore();
      const propertyRef = doc(db, 'properties', propertyId!);
      const propertySnap = await getDoc(propertyRef);

      if (propertySnap.exists()) {
        const propertyData = propertySnap.data();
        const updatedUnits = propertyData.units.map((u: any) =>
          u.unitName === unitName ? { ...u, notes: [...(u.notes || []), noteRef.fullPath] } : u
        );

        await updateDoc(propertyRef, { units: updatedUnits });
        message.success('Note saved successfully');
        navigate(-1);
      } else {
        message.error('Property not found');
      }
    } catch (error) {
      console.error("Error saving note: ", error);
      message.error('Failed to save note');
    }
  };

  return (
    <div>
      <Title level={2}>New Note for Unit {unitName}</Title>
      <Button
        icon={<SaveOutlined />}
        onClick={() => setIsModalVisible(true)}
        type="primary"
      >
        Add Note
      </Button>
      <Modal
        title="New Note"
        visible={isModalVisible}
        onOk={handleNoteSave}
        onCancel={() => setIsModalVisible(false)}
      >
        <EditorContent editor={editor} />
      </Modal>
    </div>
  );
};

export default PropertyInfoUnitViewNotes;
