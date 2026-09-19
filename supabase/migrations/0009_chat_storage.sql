insert into storage.buckets (id, name, public) values ('chat-images', 'chat-images', false)
  on conflict (id) do nothing;

create policy "chat_images_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-images' and (
      public.current_role() = 'manager'
      or exists (
        select 1 from public.chat_conversations c
        where c.id::text = (storage.foldername(name))[1]
          and (c.type = 'broadcast' or public.is_chat_member(c.id))
      )
    )
  );
create policy "chat_images_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-images' and exists (
      select 1 from public.chat_conversations c
      where c.id::text = (storage.foldername(name))[1]
        and (
          (c.type = 'broadcast' and public.current_role() = 'manager')
          or (c.type in ('dm','group') and public.is_chat_member(c.id))
        )
    )
  );

-- 注: このポリシーには `storage.foldername(name)` の `name` が `chat_conversations.name`(会話名)に
-- 束縛されてしまうバグがあり、0013で `storage.foldername(objects.name)` に修正されている。
