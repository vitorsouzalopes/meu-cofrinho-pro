import { supabase } from "@/integrations/supabase/client";

export const ensureMonthlyInstances = async (userId: string, currentMonthYear: string) => {
  try {
    // 1. Fetch all monthly templates
    const { data: templates, error: templatesError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_template", true)
      .eq("billing_type", "monthly");

    if (templatesError) throw templatesError;

    // 2. Fetch all instances for the current month
    const { data: instances, error: instancesError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_template", false)
      .eq("month_year", currentMonthYear);

    if (instancesError) throw instancesError;

    // 3. Generate missing instances
    if (templates && templates.length > 0) {
      const missingTemplates = templates.filter(template => 
        !instances?.some(instance => instance.parent_id === template.id)
      );

      if (missingTemplates.length > 0) {
        const newInstances = missingTemplates.map(template => ({
          user_id: userId,
          name: template.name,
          amount: template.amount,
          due_day: template.due_day,
          account_type: template.account_type,
          billing_type: 'monthly',
          month_year: currentMonthYear,
          is_template: false,
          parent_id: template.id,
          paid: false,
          start_date: template.start_date,
          account_category: template.account_category || 'expense'
        }));

        const { error: insertError } = await supabase
          .from("accounts")
          .insert(newInstances);

        if (insertError) throw insertError;
        return true; // Generated new instances
      }
    }
    return false;
  } catch (error) {
    console.error("Error ensuring monthly instances:", error);
    return false;
  }
};
