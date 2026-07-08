import Tag from "~/assets/svg/common/tag.svg?react"
import Unlink from "~/assets/svg/common/unlink.svg?react"
import ChevronDown from "~/assets/svg/common/chevron-down.svg?react";
import ChevronUp from "~/assets/svg/common/chevron-up.svg?react";
import SquareArrow from "~/assets/svg/common/square-arrow-out-up-right.svg?react"
import CircleX from "~/assets/svg/common/circle-x.svg?react"
import DownloadIcon from "~/assets/svg/common/download.svg?react"

import {useCallback, useState} from "react";
import Modal from "~/components/Modal";
import Button from "~/components/Button";
import SvgComponent from "~/components/SvgComponent";
import {useTranslation} from "react-i18next";

interface CantileverPoleCard {
  index:number;
  cantilever:CantileverParams;
  labelOn:boolean;
  onLabelsOn:(cantileverId:number,type:string)=>void;
  onMoveNext:(cantileverId:number)=>void;
  onMovePrevious:(cantileverId:number)=>void;
  onOpen:(cantileverId:number) => void;
  onDownload:(type:string,value:string)=>void;
  onDelete:(cantileverId:number) => void;
  onUnlink:(cantileverId:number) => void;
}

const CantileverPoleCard = (props:CantileverPoleCard) => {
  const {t} = useTranslation();
  const { cantilever, onMoveNext, onMovePrevious, onOpen, labelOn, onLabelsOn, onDownload, onDelete, onUnlink, index } = props;

  const onMoveNextCantilever = useCallback(() => {
    if(cantilever.id){
      onMoveNext(cantilever.id);
    }
  },[cantilever.id,onMoveNext])

  const onMovePreviousCantilever = useCallback(() => {
    if(cantilever.id){
      onMovePrevious(cantilever.id);
    }
  },[cantilever.id,onMovePrevious])

  const onOpenCantilever = useCallback(() => {

    if(cantilever.id){
      onOpen(cantilever.id)
    }
  },[cantilever.id,onOpen])

  const onLabelsOnCantilever = useCallback(() => {
    if(cantilever.id){
      onLabelsOn(cantilever.id,'cantilever');
    }
  },[cantilever.id,onLabelsOn])

  const onDeleteCantilever = useCallback(() => {
    if(cantilever.id){
      onDelete(cantilever.id);
      setOpenDeleteModal(false);
    }
  },[cantilever.id,onDelete])

  const onDownloadCantilever = useCallback(() => {
    if(cantilever.external_id){
      onDownload("external_id",cantilever.external_id)
    }
  },[cantilever.id,onDownload])

  const onUnlinkCantilever = useCallback(() => {
    if(cantilever.id){
      onUnlink(cantilever.id);
      setOpenUnlinkModal(false);
    }
  },[cantilever.id,onUnlink])

  
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

  const toggleDeleteModal = () => {
    setOpenDeleteModal(!openDeleteModal);
  }

  const [openUnlinkModal, setOpenUnlinkModal] = useState<boolean>(false);

  const toggleUnlinkModal = () => {
    setOpenUnlinkModal(!openUnlinkModal);
  }

  return(
    <>
      <div key={`cantilever-${cantilever.id}-${index}`} className="w-full h-auto flex flex-row gap-x-4 px-4">
        <div className="border border-2 border-gray-light rounded-xl flex flex-col sm:flex-row justify-start items-center sm:items-start w-full h-auto p-4 duration-300 group animation-element slide-in-up bg-white cursor-pointer max-sm:gap-y-2">
            <div className="w-24 h-full p-1 sm:p-4 flex justify-center items-center group-active:scale-95 duration-300 text-body">
              <SvgComponent icon={cantilever.params.model.icon ?? "cantilever_gy_type_1"}/>
            </div>
            <div className="w-full sm:w-auto h-full flex flex-col justify-start items-start gap-y-1 text-body  capitalize">
              <div className="flex flex-row gap-x-2">
                <p>{t("cantilever.name")}:</p>
                <p className="font-bold">{cantilever.external_id}</p>
              </div>
              <div className="flex flex-row gap-x-2">
                <p>{t("cantilever.fields.params.main_params.contact_wire_height")}:</p>
                <p className="font-bold">{cantilever.params.contact_wire_height}</p>
              </div>
              <div className="flex flex-row gap-x-2">
                <p>{t("cantilever.fields.params.main_params.zig_zag")}:</p>
                <p className="font-bold">{cantilever.params.zig_zag}</p>
              </div>
            </div>
            <div className="max-2xl:hidden w-auto h-full flex flex-col justify-start items-start gap-y-1 text-body  ml-12 capitalize">
              <div className="flex flex-row gap-x-2">
                <p>{t("cantilever.fields.params.main_params.system_height")}:</p>
                <p className="font-bold">{cantilever.params.system_height}</p>
              </div>
              <div className="flex flex-row gap-x-2">
                <p>{t("cantilever.fields.params.model.type.configuration")}:</p>
                <p className="font-bold">{cantilever.params.model.type.configuration}</p>
              </div>

              <div className="flex flex-row gap-x-2">
                <p>{t("cantilever.fields.params.model.type.contact_wire_configuration")}:</p>
                <p className="font-bold">{cantilever.params.model.type.contactWireConfiguration}</p>
              </div>
            </div>
            <div className="ml-auto w-auto h-full flex flex-col items-center justify-center gap-y-2 text-body ">
              <p className="font-bold capitalize">{t("cantilever.actions")}</p>
              <div className="w-auto flex flex-row justify-center gap-x-2">
                <span onClick={onOpenCantilever} className="w-auto h-auto hover:bg-primary hover:text-white duration-300 p-2 rounded-lg active:scale-95 cursor-pointer border hover:border-primary">
                  <SquareArrow className="w-5 h-5"/>
                </span>
                <span onClick={onLabelsOnCantilever} className={`${labelOn ? 'bg-primary text-white border-primary' : ''} hover:bg-primary hover:text-white w-auto h-auto  duration-300 p-2 rounded-lg active:scale-95 cursor-pointer border hover:border-primary`}>
                  <Tag className="w-5 h-5"/>
                </span>
                <span onClick={onDownloadCantilever} className="w-auto h-auto hover:bg-primary hover:text-white duration-300 p-2 rounded-lg active:scale-95 cursor-pointer border hover:border-primary">
                  <DownloadIcon className="w-5 h-5"/>
                </span>
                <span onClick={toggleUnlinkModal} className="w-auto h-auto hover:bg-primary hover:text-white duration-300 p-2 rounded-lg active:scale-95 cursor-pointer border hover:border-primary">
                  <Unlink className="w-5 h-5"/>
                </span>
                <span onClick={toggleDeleteModal} className="w-auto h-auto hover:bg-primary hover:text-white duration-300 p-2 rounded-lg active:scale-95 cursor-pointer border hover:border-primary">
                  <CircleX className="w-5 h-5"/>
                </span>
            </div>
          </div>
        </div>
        <div className="w-auto h-full flex flex-col items-center justify-center gap-y-4">
          <span onClick={onMovePreviousCantilever} className="w-auto h-auto bg-secondary border border-2 hover:bg-primary hover:text-white duration-300 p-1 rounded-full active:scale-95 cursor-pointer">
            <ChevronUp className="w-6 h-6"/>
          </span>
          <span onClick={onMoveNextCantilever} className="w-auto h-auto bg-secondary border border-2 hover:bg-primary hover:text-white duration-300 p-1 rounded-full active:scale-95 cursor-pointer">
            <ChevronDown className="w-6 h-6"/>
          </span>
        </div>
      </div>
    <Modal key={`modal-unlink-${cantilever.id}`} isOpen={openUnlinkModal} onClose={toggleUnlinkModal}>
      <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 gap-y-4">
        <div className="w-24 h-24 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
          <SvgComponent icon="cantilever_gy_type_1"/>
        </div>
        <p className="text-primary text-lg font-bold">{t("cantilever.unlink_message")}</p>
        <div className="w-full h-auto gap-x-4 flex items-center justify-center capitalize">
          <Button onClick={toggleUnlinkModal} className="capitalize px-6">{t("common.cancel")}</Button>
          <Button onClick={onUnlinkCantilever} className="capitalize px-6">{t("common.unlink")}</Button>
        </div>
      </div>
    </Modal>
    <Modal key={`modal-delete-${cantilever.id}`} isOpen={openDeleteModal} onClose={toggleDeleteModal}>
      <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 gap-y-4">
        <div className="w-24 h-24 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
          <SvgComponent icon="cantilever_gy_type_1"/>
        </div>
        <p className="text-primary text-lg font-bold">{t("cantilever.delete_message")}</p>
        <div className="w-full h-auto gap-x-4 flex items-center justify-center capitalize">
          <Button onClick={toggleDeleteModal} className="capitalize px-6">{t("common.cancel")}</Button>
          <Button onClick={onDeleteCantilever} className="capitalize px-6">{t("common.delete")}</Button>
        </div>
      </div>
    </Modal>
    </>
  )
}

export default CantileverPoleCard
