import React, { createContext, useContext, useState, useEffect } from 'react';
import { UsuarioEquipe } from '../types';
import { isUserAdminTotal, saveDocument, removeDocument } from '../services/firebaseService';

interface MasterEditModalState {
  isOpen: boolean;
  collectionName: string;
  documentId: string;
  title: string;
  currentData: Record<string, any>;
  fieldsToEdit: {
    key: string;
    label: string;
    type?: 'text' | 'number' | 'textarea' | 'date' | 'select';
    options?: string[];
  }[];
}

interface MasterEditContextType {
  isMasterEditActive: boolean;
  toggleMasterEditMode: () => void;
  canUseMasterEdit: boolean;
  openMasterEditModal: (params: Omit<MasterEditModalState, 'isOpen'>) => void;
  closeMasterEditModal: () => void;
  masterRenameField: (collectionName: string, id: string, fieldKey: string, newValue: any) => Promise<boolean>;
  masterDeleteRecord: (collectionName: string, id: string, recordLabel?: string) => Promise<boolean>;
  modalState: MasterEditModalState;
  onSaveModal: (updatedData: Record<string, any>) => Promise<boolean>;
}

const MasterEditContext = createContext<MasterEditContextType | undefined>(undefined);

export const MasterEditProvider: React.FC<{
  currentUser: UsuarioEquipe;
  children: React.ReactNode;
}> = ({ currentUser, children }) => {
  const canUseMasterEdit = isUserAdminTotal(currentUser);
  const [isMasterEditActive, setIsMasterEditActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('master_edit_mode_active') === 'true';
    } catch {
      return false;
    }
  });

  const [modalState, setModalState] = useState<MasterEditModalState>({
    isOpen: false,
    collectionName: '',
    documentId: '',
    title: '',
    currentData: {},
    fieldsToEdit: [],
  });

  // Atalho de teclado opcional (Alt + E) para ligar/desligar modo edição
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'e' && canUseMasterEdit) {
        e.preventDefault();
        toggleMasterEditMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUseMasterEdit, isMasterEditActive]);

  const toggleMasterEditMode = () => {
    if (!canUseMasterEdit) return;
    setIsMasterEditActive(prev => {
      const next = !prev;
      try {
        localStorage.setItem('master_edit_mode_active', String(next));
      } catch {}
      return next;
    });
  };

  const openMasterEditModal = (params: Omit<MasterEditModalState, 'isOpen'>) => {
    if (!canUseMasterEdit) return;
    setModalState({
      ...params,
      isOpen: true,
    });
  };

  const closeMasterEditModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  // Renomeia / altera qualquer campo direto no Firestore
  const masterRenameField = async (
    collectionName: string,
    id: string,
    fieldKey: string,
    newValue: any
  ): Promise<boolean> => {
    if (!canUseMasterEdit) return false;
    try {
      await saveDocument(collectionName, {
        id,
        [fieldKey]: newValue,
        editadoPorMaster: currentUser.nome,
        editadoEm: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      console.error('[MasterEdit] Erro ao atualizar campo:', err);
      return false;
    }
  };

  // Exclui qualquer registro diretamente com bypass total
  const masterDeleteRecord = async (
    collectionName: string,
    id: string,
    recordLabel?: string
  ): Promise<boolean> => {
    if (!canUseMasterEdit) return false;
    const confirmMsg = recordLabel
      ? `[MODO MASTER] Deseja excluir permanentemente o registro "${recordLabel}" (${collectionName})? Esta ação não pode ser desfeita.`
      : `[MODO MASTER] Deseja excluir permanentemente o documento ID ${id} de ${collectionName}?`;
    
    if (!window.confirm(confirmMsg)) return false;

    try {
      await removeDocument(collectionName, id);
      return true;
    } catch (err) {
      console.error('[MasterEdit] Erro ao excluir registro:', err);
      return false;
    }
  };

  const onSaveModal = async (updatedData: Record<string, any>): Promise<boolean> => {
    if (!modalState.documentId || !modalState.collectionName) return false;
    try {
      await saveDocument(modalState.collectionName, {
        id: modalState.documentId,
        ...updatedData,
        editadoPorMaster: currentUser.nome,
        editadoEm: new Date().toISOString(),
      });
      closeMasterEditModal();
      return true;
    } catch (err) {
      console.error('[MasterEdit Modal] Erro ao salvar dados:', err);
      return false;
    }
  };

  return (
    <MasterEditContext.Provider
      value={{
        isMasterEditActive: isMasterEditActive && canUseMasterEdit,
        toggleMasterEditMode,
        canUseMasterEdit,
        openMasterEditModal,
        closeMasterEditModal,
        masterRenameField,
        masterDeleteRecord,
        modalState,
        onSaveModal,
      }}
    >
      {children}
    </MasterEditContext.Provider>
  );
};

export const useMasterEditMode = () => {
  const ctx = useContext(MasterEditContext);
  if (!ctx) {
    throw new Error('useMasterEditMode deve ser utilizado dentro de um MasterEditProvider');
  }
  return ctx;
};
