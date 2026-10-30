"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { mockRooms } from "@/data/kids/mock-rooms";
import { ChevronIconDown, PlusIcon } from "../common/icons/Icons";

const FORM_ID = "add-kid-form";
const TITLE_ID = "add-kid-title";

const REQUIRED_MESSAGE = "Este campo es obligatorio";
const FUTURE_DATE_MESSAGE = "La fecha no puede ser futura";

interface AddKidFormState {
  name: string;
  birthDate: string;
  room: string;
  allergies: string;
  medicalNotes: string;
}

type AddKidField = keyof AddKidFormState;
type AddKidErrors = Partial<Record<AddKidField, string>>;

const EMPTY_FORM: AddKidFormState = {
  name: "",
  birthDate: "",
  room: "",
  allergies: "",
  medicalNotes: "",
};

const REQUIRED_FIELDS: AddKidField[] = ["name", "birthDate", "room"];

/** Today as YYYY-MM-DD in the local timezone (same format as a date input). */
function todayISO(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function AddKidModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fieldRefs = useRef<Partial<Record<AddKidField, HTMLElement | null>>>({});
  const scrollLock = useRef<{
    body: string;
    container: HTMLElement | null;
    containerOverflow: string;
  } | null>(null);

  const [form, setForm] = useState<AddKidFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<AddKidErrors>({});
  const [maxDate, setMaxDate] = useState("");

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
    dialog.showModal();
    lockScroll();
    fieldRefs.current.name?.focus();
  };

  const closeModal = () => {
    dialogRef.current?.close();
  };

  const handleClose = () => {
    unlockScroll();
    setForm(EMPTY_FORM);
    setErrors({});
    triggerRef.current?.focus();
  };

  const updateField = (field: AddKidField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: AddKidErrors = {};
    if (!form.name.trim()) nextErrors.name = REQUIRED_MESSAGE;
    if (!form.birthDate) {
      nextErrors.birthDate = REQUIRED_MESSAGE;
    } else if (form.birthDate > todayISO()) {
      nextErrors.birthDate = FUTURE_DATE_MESSAGE;
    }
    if (!form.room) nextErrors.room = REQUIRED_MESSAGE;

    setErrors(nextErrors);

    const firstInvalid = REQUIRED_FIELDS.find((field) => nextErrors[field]);
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    closeModal();
  };

  const fieldClass = (field: AddKidField) =>
    [
      "w-full p-[13px_16px] rounded-[14px] border-[1.5px] bg-white text-[15px] text-tinta",
      errors[field] ? "border-acento" : "border-[#EADFD0]",
    ].join(" ");

  const errorClass = "mt-1.5 mb-0 text-[13px] text-acento";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openModal}
        className="flex items-center gap-2 px-4.5 py-2.75 rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)] transition duration-150 hover:cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(238,129,100,0.85)] active:translate-y-0"
      >
        <PlusIcon />
        Agregar niño
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        aria-labelledby={TITLE_ID}
        className="w-[calc(100%-2rem)] max-w-130 max-h-[calc(100dvh-2rem)] m-auto p-0 border-0 bg-transparent backdrop:bg-[rgba(63,54,46,0.25)] overflow-y-auto"
      >
        <div className="w-full bg-[#FBF4EC] border border-borde rounded-3xl shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden">
          <div className="flex items-center justify-between px-6.5 py-5 border-b border-borde">
            <button
              type="button"
              onClick={closeModal}
              className="text-[15px] font-bold hover:cursor-pointer text-mute transition-colors duration-150 hover:text-tinta"
            >
              Cancelar
            </button>
            <h2
              id={TITLE_ID}
              className="font-display font-semibold text-[18px] text-tinta"
            >
              Agregar niño
            </h2>
            <button
              type="submit"
              form={FORM_ID}
              className="text-[15px] font-extrabold hover:cursor-pointer text-acento transition-colors duration-150 hover:text-acento-editar"
            >
              Guardar
            </button>
          </div>

          <form
            id={FORM_ID}
            onSubmit={handleSubmit}
            noValidate
            className="p-[24px_26px]"
          >
            <div className="mb-4.5">
              <label
                htmlFor="add-kid-name"
                className="block text-[12px] font-extrabold tracking-[0.7px] text-mute mb-2"
              >
                NOMBRE COMPLETO
              </label>
              <input
                id="add-kid-name"
                ref={(element) => {
                  fieldRefs.current.name = element;
                }}
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Ej. Martina López"
                className={fieldClass("name")}
              />
              {errors.name && <p className={errorClass}>{errors.name}</p>}
            </div>

            <div className="flex flex-col sm:flex-row gap-3.5 mb-4.5">
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="add-kid-birth-date"
                  className="block text-[12px] font-extrabold tracking-[0.7px] text-mute mb-2"
                >
                  FECHA DE NACIMIENTO
                </label>
                <input
                  id="add-kid-birth-date"
                  ref={(element) => {
                    fieldRefs.current.birthDate = element;
                  }}
                  type="date"
                  value={form.birthDate}
                  max={maxDate || undefined}
                  onChange={(event) => updateField("birthDate", event.target.value)}
                  className={fieldClass("birthDate")}
                />
                {errors.birthDate && (
                  <p className={errorClass}>{errors.birthDate}</p>
                )}
              </div>

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
                    ref={(element) => {
                      fieldRefs.current.room = element;
                    }}
                    value={form.room}
                    onChange={(event) => updateField("room", event.target.value)}
                    className={`${fieldClass("room")} appearance-none pr-10 font-bold`}
                  >
                    <option value="">Elegí una sala</option>
                    {mockRooms.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </select>
                  <ChevronIconDown />
                </div>
                {errors.room && <p className={errorClass}>{errors.room}</p>}
              </div>
            </div>

            <div className="mb-4.5">
              <label
                htmlFor="add-kid-allergies"
                className="block text-[12px] font-extrabold tracking-[0.7px] text-mute mb-2"
              >
                ALERGIAS (ETIQUETAS)
              </label>
              <input
                id="add-kid-allergies"
                ref={(element) => {
                  fieldRefs.current.allergies = element;
                }}
                type="text"
                value={form.allergies}
                onChange={(event) => updateField("allergies", event.target.value)}
                placeholder="Ej. Maní, Lactosa"
                className={fieldClass("allergies")}
              />
              {errors.allergies && <p className={errorClass}>{errors.allergies}</p>}
            </div>

            <div>
              <label
                htmlFor="add-kid-medical-notes"
                className="block text-[12px] font-extrabold tracking-[0.7px] text-mute mb-2"
              >
                NOTAS MÉDICAS
              </label>
              <textarea
                id="add-kid-medical-notes"
                ref={(element) => {
                  fieldRefs.current.medicalNotes = element;
                }}
                value={form.medicalNotes}
                onChange={(event) =>
                  updateField("medicalNotes", event.target.value)
                }
                placeholder="Indicaciones, medicación, contactos…"
                className={`${fieldClass("medicalNotes")} min-h-22.5 resize-y leading-normal`}
              />
              {errors.medicalNotes && (
                <p className={errorClass}>{errors.medicalNotes}</p>
              )}
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
