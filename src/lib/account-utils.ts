import { supabase } from "@/integrations/supabase/client";

export const ensureMonthlyInstances = async (userId: string, currentMonthYear: string) => {
  try {
    // 1. Fetch all monthly and debt templates
    const { data: templates, error: templatesError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_template", true)
      .in("billing_type", ["monthly", "debt"]);

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
      const missingTemplates = templates.filter(template => {
        const hasInstance = instances?.some(instance => instance.parent_id === template.id);
        if (hasInstance) return false;
        
        // Check start_date
        if (template.start_date) {
          const [startYear, startMonth] = template.start_date.split('-').map(Number);
          const [currYear, currMonth] = currentMonthYear.split('-').map(Number);
          
          if (currYear < startYear) return false;
          if (currYear === startYear && currMonth < startMonth) return false;
        }

        // For debts, only generate if they still have installments left
        if (template.billing_type === 'debt') {
          return template.remaining_months === null || template.remaining_months > 0;
        }
        
        return true;
      });

      if (missingTemplates.length > 0) {
        const newInstances = missingTemplates.map(template => ({
          user_id: userId,
          name: template.name,
          amount: template.amount,
          due_day: template.due_day,
          account_type: template.account_type,
          billing_type: template.billing_type,
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
