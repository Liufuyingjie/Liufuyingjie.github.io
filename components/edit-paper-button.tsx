"use client";
import Link from "next/link";
import Icon from "./icons";
export default function EditPaperButton({ slug }: { slug: string }) {
  return <Link className="edit-paper-button" href={`/papers/${slug}/edit/`}><Icon name="pen" width="15" height="15"/><span>编辑笔记</span></Link>;
}
