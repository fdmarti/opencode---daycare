"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { mockRecipients } from "@/data/feed/mock-recipients";
import { mockPostTypes } from "@/data/feed/mock-post-types";
import type { MockPostType } from "@/data/feed/mock-post-types";
import { ImagePlaceholderIcon, PlusIcon } from "@/components/common/icons/Icons";
import { Badge } from "@/components/common/ui/Badge";
import { CustomButton } from "@/components/common/ui/CustomButton";

const FORM_ID = "new-post-form";
const TITLE_ID = "new-post-title";

const NO_RECIPIENT_MESSAGE = "Elegí al menos un destinatario";
const NO_TYPE_MESSAGE = "Elegí un tipo";
const REQUIRED_MESSAGE = "Este campo es obligatorio";

interface NewPostFormState {
  recipientIds: string[];
  type: MockPostType | "";
  description: string;
}

type NewPostField = "recipients" | "type" | "description";
type NewPostErrors = Partial<Record<NewPostField, string>>;

const EMPTY_FORM: NewPostFormState = {
  recipientIds: mockRecipients.map((recipient) => recipient.id),
  type: "",
  description: "",
};

const SECTION_LABEL_CLASS =
  "block text-[12px] font-extrabold tracking-[0.7px] text-mute mb-2.5";

const ERROR_CLASS = "mt-1.5 mb-0 text-[13px] text-acento";

export function NewPostModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const recipientRefs = useRef<Partial<Record<string, HTMLButtonElement | null>>>({});
  const typeRefs = useRef<Partial<Record<MockPostType, HTMLButtonElement | null>>>({});
  const scrollLock = useRef<{
    body: string;
    container: HTMLElement | null;
    containerOverflow: string;
  } | null>(null);

  const [form, setForm] = useState<NewPostFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<NewPostErrors>({});

  const allRecipientsSelected = mockRecipients.every((recipient) =>
    form.recipientIds.includes(recipient.id),
  );

  const lockScroll = () => {
    // The page scrolls inside <main>, so the body alone does not stop it.
    // The trigger lives in the sidebar, outside <main>, so fall back to a query.
    const container =
      dialogRef.current?.closest("main") ?? document.querySelector("main");
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
    dialog.showModal();
    lockScroll();
    recipientRefs.current[mockRecipients[0]?.id]?.focus();
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

  const toggleRecipient = (id: string) => {
    setForm((current) => ({
      ...current,
      recipientIds: current.recipientIds.includes(id)
        ? current.recipientIds.filter((recipientId) => recipientId !== id)
        : [...current.recipientIds, id],
    }));
  };

  const toggleAllRecipients = () => {
    setForm((current) => ({
      ...current,
      recipientIds: allRecipientsSelected
        ? []
        : mockRecipients.map((recipient) => recipient.id),
    }));
  };

  const selectType = (type: MockPostType) => {
    setForm((current) => ({
      ...current,
      type: current.type === type ? "" : type,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: NewPostErrors = {};
    if (form.recipientIds.length === 0) nextErrors.recipients = NO_RECIPIENT_MESSAGE;
    if (!form.type) nextErrors.type = NO_TYPE_MESSAGE;
    if (!form.description.trim()) nextErrors.description = REQUIRED_MESSAGE;

    setErrors(nextErrors);

    if (nextErrors.recipients) {
      recipientRefs.current[mockRecipients[0]?.id]?.focus();
      return;
    }
    if (nextErrors.type) {
      typeRefs.current[mockPostTypes[0]]?.focus();
      return;
    }
    if (nextErrors.description) {
      descriptionRef.current?.focus();
      return;
    }

    closeModal();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openModal}
        className="flex items-center justify-center gap-2 w-full p-3 rounded-2xl bg-linear-to-b from-boton-top to-boton-bottom text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)] mb-4.5"
      >
        <PlusIcon size={17} />
        Nueva publicación
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleClose}
        aria-labelledby={TITLE_ID}
        className="w-[calc(100%-2rem)] max-w-145 max-h-[calc(100dvh-2rem)] m-auto p-0 border-0 bg-transparent backdrop:bg-[rgba(63,54,46,0.25)] overflow-y-auto"
      >
        <div className="w-full bg-[#FBF4EC] border border-borde rounded-3xl shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden">
          <div className="flex items-center justify-between px-6.5 py-5 border-b border-borde">
            <CustomButton type="button" onClick={closeModal} variant="cancel">
              Cancelar
            </CustomButton>
            <h2 id={TITLE_ID} className="font-display font-semibold text-[18px] text-tinta">
              Nueva publicación
            </h2>
            <CustomButton type="submit" form={FORM_ID} variant="save">
              Publicar
            </CustomButton>
          </div>

          <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="p-[24px_26px]">
            <div>
              <span className={SECTION_LABEL_CLASS}>PARA</span>
              <div
                role="group"
                aria-label="Destinatarios"
                className="flex flex-wrap gap-2.25 mb-5.5"
              >
                {mockRecipients.map((recipient) => {
                  const selected = form.recipientIds.includes(recipient.id);
                  return (
                    <Badge
                      key={recipient.id}
                      ref={(element) => {
                        recipientRefs.current[recipient.id] = element;
                      }}
                      size="sm"
                      active={selected}
                      onClick={() => toggleRecipient(recipient.id)}
                      leading={
                        <span
                          className="w-6.5 h-6.5 rounded-full flex items-center justify-center font-display font-semibold text-[13px]"
                          style={{
                            backgroundColor: recipient.avatarBackground,
                            color: recipient.avatarText,
                          }}
                        >
                          {recipient.initial}
                        </span>
                      }
                    >
                      {recipient.name}
                    </Badge>
                  );
                })}
                <Badge size="sm" active={allRecipientsSelected} onClick={toggleAllRecipients}>
                  Toda la sala
                </Badge>
              </div>
              {errors.recipients && <p className={ERROR_CLASS}>{errors.recipients}</p>}
            </div>

            <div>
              <span className={SECTION_LABEL_CLASS}>TIPO</span>
              <div
                role="group"
                aria-label="Tipo de publicación"
                className="flex flex-wrap gap-2.25 mb-5.5"
              >
                {mockPostTypes.map((type) => (
                  <Badge
                    key={type}
                    ref={(element) => {
                      typeRefs.current[type] = element;
                    }}
                    size="md"
                    active={form.type === type}
                    onClick={() => selectType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
              {errors.type && <p className={ERROR_CLASS}>{errors.type}</p>}
            </div>

            <div className="mb-5.5">
              <label htmlFor="new-post-description" className={SECTION_LABEL_CLASS}>
                DESCRIPCIÓN
              </label>
              <textarea
                id="new-post-description"
                ref={descriptionRef}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Contá cómo le fue hoy…"
                aria-invalid={errors.description ? true : undefined}
                className={[
                  "w-full min-h-30 resize-y p-[14px_16px] rounded-[14px] border-[1.5px] bg-white text-[15px] leading-[1.5] text-tinta",
                  errors.description ? "border-acento" : "border-[#EADFD0]",
                ].join(" ")}
              />
              {errors.description && <p className={ERROR_CLASS}>{errors.description}</p>}
            </div>

            <div>
              <span className={SECTION_LABEL_CLASS}>FOTOS</span>
              <div className="flex gap-3">
                <div className="w-24 h-24 rounded-[14px] bg-foto-fondo border border-borde flex items-center justify-center text-[#CBB89F]">
                  <ImagePlaceholderIcon size={26} />
                </div>
                {/* Placeholder only: no upload yet, it lands in a future spec. */}
                <div className="w-24 h-24 rounded-[14px] border-[1.5px] border-dashed border-foto-borde bg-foto-fondo flex flex-col items-center justify-center gap-1.5 text-foto-tinta">
                  <span className="text-acento-editar">
                    <PlusIcon size={22} />
                  </span>
                  <span className="text-[12px]">Agregar</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
