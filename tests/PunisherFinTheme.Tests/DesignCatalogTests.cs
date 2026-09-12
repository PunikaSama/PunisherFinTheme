using PunisherFinTheme.Contracts;

namespace PunisherFinTheme.Tests;

public sealed class DesignCatalogTests
{
    [Fact]
    public void CatalogContainsOneDefaultAndUniqueSafeIds()
    {
        DesignOption[] designs = ThemeDesignCatalog.All.ToArray();

        Assert.Equal(2, designs.Length);
        Assert.Single(designs, design => design.IsDefault);
        Assert.Equal(ThemeDesignCatalog.DefaultId, designs.Single(design => design.IsDefault).Id);
        Assert.Equal(designs.Length, designs.Select(design => design.Id).Distinct(StringComparer.Ordinal).Count());
        Assert.All(designs, design =>
        {
            Assert.Matches("^[a-z0-9-]+$", design.Id);
            Assert.StartsWith("/PunisherFinTheme/", design.Stylesheet, StringComparison.Ordinal);
        });
    }

    [Fact]
    public void CatalogKeepsAccentOutsideDesignMetadata()
    {
        Assert.DoesNotContain(ThemeDesignCatalog.All, design =>
            design.GetType().GetProperties().Any(property =>
                property.Name.Contains("Accent", StringComparison.OrdinalIgnoreCase)
                || property.Name.Contains("Color", StringComparison.OrdinalIgnoreCase)));
    }
}
