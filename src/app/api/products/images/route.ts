import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { uploadProductImage } from "@/lib/products-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecione uma imagem para enviar." }, { status: 400 });
    }

    return NextResponse.json({ url: await uploadProductImage(file) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao enviar a imagem." },
      { status: 400 }
    );
  }
}
