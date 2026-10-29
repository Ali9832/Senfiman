import RoleTicketsList from "@/components/RoleTicketsList";

export default function WardenTickets() {
  return (
    <RoleTicketsList
      title="تیکت‌های خوابگاه"
      subtitle="بررسی، تأیید اولویت و ارجاع به مجری"
      scope="warden"
      roleLabel="سرپرست"
    />
  );
}
