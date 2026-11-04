"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { addKidSchema } from "@/schemas/add-kid-schema";
import type { AddKidFormValues } from "@/schemas/add-kid-schema";
import { useKidsStore } from "@/stores/kids-store";
import { useRoomsStore } from "@/stores/rooms-store";
import { parseAllergyTags, todayISO } from "@/utils/kids";
import { ChevronIcon, PlusIcon } from "../common/icons/Icons";
import { CustomButton } from "../common/ui/CustomButton";
import { CustomInput } from "../common/ui/CustomInput";

const FORM_ID = "add-kid-form";
const TITLE_ID = "add-kid-title";

const SAVE_ERROR_MESSAGE = "No se pudo guardar el niño. Intentá de nuevo.";
const NO_ROOMS_MESSAGE = "No hay salas disponibles para esta guardería.";

/** Orden en el que se enfoca el primer campo inválido al enviar. */
const FOCUS_ORDER: (keyof AddKidFormValues)[] = ["name", "birthDate", "room"];

/**
 * Modal de alta de niños.
 *
 * El formulario lo maneja React Hook Form con un schema de Zod: los inputs
 * quedan sin controlar (`register`) y los mensajes de error salen de
 * `formState.errors`. El insert lo hace el store (`addKid`), que también
 * recarga el listado.
 */
export function AddKidModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const scrollLock = useRef<{
    body: string;
    container: HTMLElement | null;
    containerOverflow: string;
  } | null>(null);

  const [maxDate, setMaxDate] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const addKid = useKidsStore((state) => state.addKid);
  const rooms = useRoomsStore((state) => state.rooms);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<AddKidFormValues>({
    resolver: zodResolver(addKidSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      birthDate: "",
      room: "",
      allergies: "",
      medicalNotes: "",
    },
  });

  const lockScroll = () => {
    // The page scrolls inside <main>, so the body alone does not stop it.
    const container = dialogRef.current?.closest("main");
    scrollLock.current = {
      body: document.body.style.overflow,
      container: container instanceof HTMLElement ? container : null,
      containerOverflow: container instanceof HTMLElement ? container.style.overflow : "",
    };
    document.body.style.overflow = "hidden";
    if (scrollLock.current.container) {
      scrollLock.current.container.style.overflow = "hidden";
    }
  };

  const unlockScroll = () => {
    document.body.style.overflow = scrollLock.current?.body ?? "";
    const { container, containerOverflow } = scrollLock.current ?? {};
    if (container) container.style.overflow = containerOverflow ?? "";
  };

  const openModal = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    // Computed on open so the server render never disagrees with the client.
    setMaxDate(todayISO());
    setSaveError(null);
    dialog.showModal();
    lockScroll();
    setFocus("name");
  };

  const closeModal = () => {
    dialogRef.current?.close();
  };

  const handleClose = () => {
    unlockScroll();
    reset();
    setSaveError(null);
    triggerRef.current?.focus();
  };

  const onSubmit = async (values: AddKidFormValues) => {
    setSaveError(null);

    try {
      await addKid({
        room_id: values.room,
        // El trim del schema ya recortó el nombre y las notas.
        full_name: values.name,
        birth_date: values.birthDate,
        medical_notes: values.medicalNotes || null,
        allergy_tags: parseAllergyTags(values.allergies),
      });

      closeModal();
    } catch (err) {
      console.error("No se pudo guardar el niño:", err);
      setSaveError(SAVE_ERROR_MESSAGE);
    }
  };

  const onInvalid = (invalidErrors: Record<string, unknown>) => {
    const firstInvalid = FOCUS_ORDER.find((field) => invalidErrors[field]);
    if (firstInvalid) {
      setFocus(firstInvalid);
    }
  };

  // `handleSubmit` se invoca en el submit, no durante el render.
  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(onSubmit, onInvalid)(event);
  };

  const fieldClass = (hasError: boolean) =>
    [
      "w-full p-[13px_16px] rounded-[14px] border-[1.5px] bg-white text-[15px] text-tinta",
      hasError ? "border-acento" : "border-[#EADFD0]",
    ].join(" ");

  const errorClass = "mt-1.5 mb-0 text-[13px] text-acento";

  return (
    <>
      <CustomButton
        ref={triggerRef}
        type="button"
        onClick={openModal}
      >
        <PlusIcon />
        Agregar niño
      </CustomButton>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        aria-labelledby={TITLE_ID}
        className="w-[calc(100%-2rem)] max-w-130 max-h-[calc(100dvh-2rem)] m-auto p-0 border-0 bg-transparent backdrop:bg-[rgba(63,54,46,0.25)] overflow-y-auto"
      >
        <div className="w-full bg-[#FBF4EC] border border-borde rounded-3xl shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden">
          <div className="flex items-center justify-between px-6.5 py-5 border-b border-borde">
            <CustomButton
              type="button"
              onClick={closeModal}
              variant="cancel"
            >
              Cancelar
            </CustomButton>
            <h2 id={TITLE_ID} className="font-display font-semibold text-[18px] text-tinta">
              Agregar niño
            </h2>
            <CustomButton
              type="submit"
              form={FORM_ID}
              variant="save"
              disabled={isSubmitting}
              className={isSubmitting ? "opacity-60 cursor-not-allowed" : undefined}
            >
              {isSubmitting ? "Guardando…" : "Guardar"}
            </CustomButton>
          </div>

          <form
            id={FORM_ID}
            onSubmit={onFormSubmit}
            noValidate
            className="p-[24px_26px]"
          >
            {saveError && (
              <p
                role="alert"
                className="mb-4.5 text-[13px] font-bold text-acento"
              >
                {saveError}
              </p>
            )}
            <CustomInput
              id="add-kid-name"
              type="text"
              label="NOMBRE COMPLETO"
              placeholder="Ej. Martina López"
              error={errors.name?.message}
              className="mb-4.5"
              {...register("name")}
            />

            <div className="flex flex-col sm:flex-row gap-3.5 mb-4.5">
              <CustomInput
                id="add-kid-birth-date"
                type="date"
                label="FECHA DE NACIMIENTO"
                max={maxDate || undefined}
                error={errors.birthDate?.message}
                className="flex-1 min-w-0"
                {...register("birthDate")}
              />

              <div className="flex-1 min-w-0">
                <label
                  htmlFor="add-kid-room"
                  className="block text-[12px] font-extrabold tracking-[0.7px] text-mute mb-2"
                >
                  SALA
                </label>
                <div className="relative">
                  <select
                    id="add-kid-room"
                    className={`${fieldClass(Boolean(errors.room))} appearance-none pr-10 font-bold`}
                    {...register("room")}
                  >
                    <option value="" disabled>Elegí una sala</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foto-tinta">
                    <ChevronIcon rotate={0} />
                  </span>
                </div>
                {errors.room?.message && <p className={errorClass}>{errors.room.message}</p>}
                {rooms.length === 0 && (
                  <p className="mt-1.5 mb-0 text-[13px] text-mute">{NO_ROOMS_MESSAGE}</p>
                )}
              </div>
            </div>

            <CustomInput
              id="add-kid-allergies"
              type="text"
              label="ALERGIAS (ETIQUETAS)"
              placeholder="Ej. Maní, Lactosa"
              className="mb-4.5"
              {...register("allergies")}
            />

            <div>
              <label
                htmlFor="add-kid-medical-notes"
                className="block text-[12px] font-extrabold tracking-[0.7px] text-mute mb-2"
              >
                NOTAS MÉDICAS
              </label>
              <textarea
                id="add-kid-medical-notes"
                placeholder="Indicaciones, medicación, contactos…"
                className={`${fieldClass(Boolean(errors.medicalNotes))} min-h-22.5 resize-y leading-normal`}
                {...register("medicalNotes")}
              />
              {errors.medicalNotes?.message && (
                <p className={errorClass}>{errors.medicalNotes.message}</p>
              )}
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
